const wasm = fetch('crypto.wasm')
    .then((r) => r.arrayBuffer())
    .then((b) => WebAssembly.instantiate(b))
    .then((w) => w.instance.exports);

// Opens a .jwpub (a zip whose "contents" entry is itself a zip) and renders
// each publication document into the page.
async function displayFile(file) {
    const container = document.createElement('div');
    container.classList.add('contentOnly');
    document.querySelector('.container').append(container);

    try {
        const outer = await JSZip.loadAsync(await file.arrayBuffer());
        const files = await JSZip.loadAsync(await outer.file('contents').async('uint8array'));

        const SQL = await initSqlJs();
        for (const dbFile of files.filter((name) => name.endsWith('.db'))) {
            await renderDocuments(new SQL.Database(await dbFile.async('uint8array')), container);
        }
        await inlineImages(files);
    } catch (e) {
        console.error('Failed to open JWPUB file:', e);
    }
}

// Decrypts every Document row and appends its HTML to the container.
async function renderDocuments(db, container) {
    // https://github.com/darioragusa/JW-Library-macOS/issues/1#issuecomment-1079989526
    const info = getPublicationInfo(db);
    const sha256 = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(info)));

    const material = deriveKey(await wasm, sha256);
    const key = await crypto.subtle.importKey(
        'raw', material.subarray(0, 16), { name: 'AES-CBC' }, false, ['decrypt']);
    const iv = material.subarray(16, 32);

    for (const content of getDocuments(db)) {
        const plaintext = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, content);

        const entry = document.createElement('div');
        entry.classList.add('pub-mwb');
        entry.innerHTML = new TextDecoder().decode(await inflate(plaintext));
        container.append(entry);
    }
}

// Replaces jwpub-media:// image references with the inline base64 data.
async function inlineImages(files) {
    for (const image of files.filter((name) => name.endsWith('.jpg'))) {
        const element = document.querySelector(`img[src='jwpub-media://${image.name}']`);
        if (element) element.src = `data:image/jpg;base64,${await image.async('base64')}`;
    }
}

function getPublicationInfo(db) {
    const stmt = db.prepare('SELECT MepsLanguageIndex, Symbol, Year, IssueTagNumber FROM Publication');
    while (stmt.step()) {
        const publication = stmt.getAsObject();
        if(!parseInt(publication.IssueTagNumber)) delete publication.IssueTagNumber;
        return Object.values(publication).join('_');
    }
}

function getDocuments(db) {
    const stmt = db.prepare('SELECT Content FROM Document ORDER BY DocumentId ASC');
    const documents = [];
    while (stmt.step()) {
        documents.push(stmt.getAsObject().Content);
    }
    return documents;
}

// zlib-inflates bytes using the native DecompressionStream.
async function inflate(bytes) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
    return new Response(stream).arrayBuffer();
}

// XORs the 32-byte sha256 with the secret key baked into crypto.wasm,
// returning the 32-byte AES material (key = first 16 bytes, iv = last 16).
function deriveKey(x, sha256) {
    new Uint8Array(x.memory.buffer, x.in_ptr(), 32).set(sha256);
    x.xor32();
    return new Uint8Array(x.memory.buffer, x.out_ptr(), 32).slice();
}

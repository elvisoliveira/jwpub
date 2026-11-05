const wasm = fetch('crypto.wasm')
    .then((r) => r.arrayBuffer())
    .then((b) => WebAssembly.instantiate(b))
    .then((w) => w.instance.exports);

// MepsLanguageIndex → jw.org language code (.ml-*). styles.css keys fonts and
// letter-spacing off .ml-*/.ms-* (script) and .dir-* on the .jwac element.
// ponytail: Latin, left-to-right languages only; add { ml, ms, dir } entries
// (e.g. ARABIC/rtl) when other publications matter. 6 = O is assumed, untested.
const LANGUAGES = { 0: 'E', 1: 'S', 2: 'X', 3: 'F', 4: 'I', 5: 'T', 6: 'O' };

// Opens a .jwpub (a zip whose "contents" entry is itself a zip) and renders
// each publication document into the page.
async function displayFile(file) {
    const container = document.createElement('div');
    document.querySelector('#reader').append(container);
    document.body.classList.add('loaded');

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

    const pub = getPublication(db);
    const ml = LANGUAGES[pub.MepsLanguageIndex];
    for (const doc of getDocuments(db)) {
        const plaintext = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, doc.Content);

        // Same hooks jw.org puts on its article element.
        const entry = document.createElement('article');
        entry.dir = 'ltr';
        entry.classList.add('jwac', 'dir-ltr', 'ms-ROMAN', 'layout-reading',
            `pub-${pub.UndatedSymbol}`, `docClass-${doc.Class}`, `docId-${doc.MepsDocumentId}`);
        if (ml) entry.classList.add(`ml-${ml}`);
        entry.innerHTML = new TextDecoder().decode(await inflate(plaintext));
        container.append(entry);
    }
}

// Replaces jwpub-media:// image references with the inline base64 data.
const IMAGE_TYPES = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', gif: 'gif', svg: 'svg+xml' };

async function inlineImages(files) {
    for (const image of files.filter((name) => name.split('.').pop().toLowerCase() in IMAGE_TYPES)) {
        const elements = document.querySelectorAll(`img[src='jwpub-media://${CSS.escape(image.name)}']`);
        if (!elements.length) continue;
        const type = IMAGE_TYPES[image.name.split('.').pop().toLowerCase()];
        const src = `data:image/${type};base64,${await image.async('base64')}`;
        elements.forEach((element) => { element.src = src; });
    }
}

function getPublication(db) {
    const stmt = db.prepare('SELECT MepsLanguageIndex, UndatedSymbol FROM Publication');
    stmt.step();
    return stmt.getAsObject();
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
    const stmt = db.prepare('SELECT Class, MepsDocumentId, Content FROM Document ORDER BY DocumentId ASC');
    const documents = [];
    while (stmt.step()) {
        documents.push(stmt.getAsObject());
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

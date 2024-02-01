const dropArea = document.querySelector('.drag-area');
const dragText = document.querySelector('.header');
const input = dropArea.querySelector('input');

dropArea.querySelector('.button').onclick = () => {
    input.click();
};

input.addEventListener('change', function() {
    dropArea.classList.add('active');
    Array.from(this.files).forEach((file) => {
        displayFile(file);
    });
});

dropArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropArea.classList.add('active');
    dragText.textContent = 'Release to Upload';
});

dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('active');
    dragText.textContent = 'Drag & Drop';
});

dropArea.addEventListener('drop', (event) => {
    event.preventDefault();

    Array.from(event.dataTransfer.files).forEach((file) => {
        displayFile(file);
    });
});

function displayFile(file) {
    const r = new FileReader();
    r.onload = function() {
        JSZip.loadAsync(r.result).then(function(zip) {
            // TODO Your code goes here. This is just an example.
            zip.file("contents").async('uint8array').then(function(contents) {
                JSZip.loadAsync(contents).then(function(files) {
                    const contentOnly = document.createElement("div");
                    contentOnly.classList.add('contentOnly');
                    document.querySelector('.container').append(contentOnly);
                    files.filter((name) => name.endsWith('.db')).forEach((database) => {
                        database.async('uint8array').then(function(sqlite) {
                            initSqlJs().then(function(SQL) {
                                const db = new SQL.Database(sqlite);
                                // https://github.com/darioragusa/JW-Library-macOS/issues/1#issuecomment-1079989526
                                const info = getPublicationInfo(db);

                                const sha256 = CryptoJS.SHA256(info).toString();

                                const bitwiseXOR = hexXOR('11cbb5587e32846d4c26790c633da289f66fe5842a3a585ce1bc3a294af5ada7', sha256);

                                const key = CryptoJS.enc.Hex.parse(bitwiseXOR.slice(0, 32));
                                const iv  = CryptoJS.enc.Hex.parse(bitwiseXOR.substr(-32));

                                const documents = getDocuments(db);
                                documents.forEach((d) => {
                                    const ciphertext = bytesToHex(d);
                                    const decryptedHex = CryptoJS.AES.decrypt({
                                        ciphertext: CryptoJS.enc.Hex.parse(ciphertext)
                                    }, key, {
                                        iv: iv,
                                        mode: CryptoJS.mode.CBC
                                    });
                                    const decryptedBytes = hexToBytes(decryptedHex.toString());
                                    const decompressed = (new Zlib.Inflate(decryptedBytes)).decompress();

                                    const entry = document.createElement("div");
                                    entry.classList.add('pub-mwb');
                                    entry.innerHTML = new TextDecoder().decode(decompressed);

                                    contentOnly.append(entry);
                                });
                            }).finally(() => {
                                files.filter((name) => name.endsWith('.jpg')).forEach((image) => {
                                    image.async('base64').then(function(base64) {
                                        const element = document.querySelector(`img[src="jwpub-media://${image.name}"]`);
                                        element && element.setAttribute("src", `data:image/jpg;base64,${base64}`);
                                    });
                                });
                            });
                        });
                    });
                }).catch(function(e) {
                    console.error("Failed to open ZIP file:", e);
                })
            })
        }).catch(function(e) {
            console.error("Failed to open ZIP file:", e);
        })
    }
    r.readAsArrayBuffer(file);
}

function getPublicationInfo(db) {
    const stmt = db.prepare("SELECT MepsLanguageIndex, Symbol, Year, IssueTagNumber FROM Publication");
    while (stmt.step()) {
        const publication = stmt.getAsObject();
        // @TODO: IssueTagNumber might not be present
        return Object.values(publication).join('_');
    }
}

function getDocuments(db) {
    const stmt = db.prepare("SELECT Content FROM Document ORDER BY DocumentId ASC");
    const documents = [];
    while (stmt.step()) {
        const document = stmt.getAsObject();
        documents.push(document.Content);
    }
    return documents;
}

function hexXOR(a, b) {
    return Array.from(a, (char, i) => (parseInt(char, 16) ^ parseInt(b[i], 16)).toString(16).toUpperCase()).join('');
}

function bytesToHex(bytes) {
    return bytes.reduce((hex, byte) => hex + byte.toString(16).padStart(2, '0'), '');
}

function hexToBytes(hex) {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return bytes;
}
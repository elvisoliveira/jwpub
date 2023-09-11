const dropArea = document.querySelector('.drag-area');
const dragText = document.querySelector('.header');
const input = dropArea.querySelector('input');

let file;

dropArea.querySelector('.button').onclick = () => {
    input.click();
};

input.addEventListener('change', function() {
    file = this.files[0];
    dropArea.classList.add('active');
    displayFile();
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
    displayFile();
});

function displayFile() {
    const r = new FileReader();
    r.onload = function() {
        JSZip.loadAsync(r.result).then(function(zip) {
            // TODO Your code goes here. This is just an example.
            zip.file("contents").async('uint8array').then(function(contents) {
                JSZip.loadAsync(contents).then(function(internal) {
                    const contents = document.createElement("div");
                    contents.id = 'contents';
                    dropArea.append(contents);
                    internal.forEach(function(filename) {
                        const [name, extension] = filename.split('.');
                        if(['jpg'].includes(extension)) {
                            internal.file(filename).async('base64').then(function(base64) {
                                document.getElementById('contents').insertAdjacentHTML('beforeend', `<img src="data:image/jpg;base64,${base64}">`);
                            });
                        }
                        if(['db'].includes(extension)) {
                            internal.file(filename).async('uint8array').then(function(sqlite) {
                                initSqlJs().then(function(SQL) {
                                    const db = new SQL.Database(sqlite);
                                    const words = getWords(db);
                                    const sIndexes = getIndexes(db);

                                    let loop = true;
                                    let docID = 0;
                                    let curDocIndex = "128";
                                    let fullText = {};

                                    if (fullText[docID] === undefined) {
                                        fullText[docID] = "";
                                    }

                                    let totalLoops = 0;

                                    while (loop) {
                                        let finded = false;

                                        totalLoops++;
                                        if (totalLoops > 1000) {
                                            loop = false;
                                        }

                                        for (let i = 0; i < sIndexes.length; i++) {
                                            if (sIndexes[i].TextUnitIndices.startsWith("128")) {
                                                if (sIndexes[i].PositionalList.startsWith(curDocIndex)) {
                                                    let rem = sIndexes[i].PositionalListIndex.substring(0, 3);
                                                    if (parseInt(rem) > 128) {
                                                        finded = true;
                                                        let wd = words[sIndexes[i].WordID] || "";
                                                        if (wd !== String(fullText[docID]?.split(" ").pop() || "")) {
                                                            fullText[docID] += wd + " ";
                                                        }
                                                        sIndexes[i].PositionalList = sIndexes[i].PositionalList.substring(curDocIndex.length).trim();
                                                        rem = String(parseInt(rem) - 1);
                                                        sIndexes[i].PositionalListIndex = rem + sIndexes[i].PositionalListIndex.substring(3);

                                                        let curDocIndexArray = curDocIndex.split(" ");
                                                        let repo = false;

                                                        for (let j = 0; j < curDocIndexArray.length; j++) {
                                                            if (j === 0) {
                                                                if ((curDocIndexArray[j] === "255" && curDocIndexArray.length === 1) || (curDocIndexArray[j] === "127" && curDocIndexArray.length > 1)) {
                                                                    repo = true;
                                                                    curDocIndex = "0";

                                                                    if (repo && j === curDocIndexArray.length - 1) {
                                                                        curDocIndex += " 129";
                                                                        repo = false;
                                                                    }
                                                                } else {
                                                                    curDocIndex = String(parseInt(curDocIndexArray[j]) + 1);
                                                                    repo = false;
                                                                }
                                                            } else {
                                                                if (repo) {
                                                                    if (curDocIndexArray[j] === "255") {
                                                                        repo = true;
                                                                        curDocIndex += " 129";
                                                                        if (repo && j === curDocIndexArray.length - 1) {
                                                                            curDocIndex += " 129";
                                                                            repo = false;
                                                                        }
                                                                    } else {
                                                                        curDocIndex += " " + String(parseInt(curDocIndexArray[j]) + 1);
                                                                        repo = false;
                                                                    }
                                                                } else {
                                                                    curDocIndex += " " + curDocIndexArray[j];
                                                                }
                                                            }
                                                        }
                                                        break;
                                                    }
                                                }
                                            }
                                        }

                                        if (!finded) {
                                            let toRem = [];

                                            for (let i = 0; i < sIndexes.length; i++) {
                                                let docI = sIndexes[i].TextUnitIndices.substring(0, 3);
                                                sIndexes[i].TextUnitIndices = sIndexes[i].TextUnitIndices.substring(3);

                                                if (parseInt(docI) === 128) {
                                                    sIndexes[i].TextUnitIndices = sIndexes[i].TextUnitIndices.trim();

                                                    if (sIndexes[i].TextUnitIndices !== "") {
                                                        docI = sIndexes[i].TextUnitIndices.substring(0, 3);
                                                        sIndexes[i].TextUnitIndices = docI + sIndexes[i].TextUnitIndices.substring(3);
                                                        docI = String(parseInt(docI) - 1);
                                                    }
                                                } else {
                                                    docI = String(parseInt(docI) - 1);
                                                }

                                                sIndexes[i].TextUnitIndices = docI + sIndexes[i].TextUnitIndices;

                                                if (sIndexes[i].TextUnitIndices === "") {
                                                    toRem.push(i);
                                                }

                                                let rem = sIndexes[i].PositionalListIndex.substring(0, 3);

                                                if (parseInt(rem) === 128) {
                                                    sIndexes[i].PositionalListIndex = sIndexes[i].PositionalListIndex.substring(3).trim();
                                                }
                                            }

                                            for (let i = toRem.length - 1; i >= 0; i--) {
                                                sIndexes.splice(toRem[i], 1);
                                            }

                                            docID++;

                                            if (fullText[docID] === undefined) {
                                                fullText[docID] = "";
                                            }

                                            curDocIndex = "128";
                                        }

                                        if (sIndexes.length === 0) {
                                            loop = false;
                                        }
                                    }
                                    Object.entries(fullText).forEach(function(p) {
                                        if(p[1].length) {
                                            document.getElementById('contents').insertAdjacentHTML('afterbegin', `<p>${p[1]}</p>`);
                                        }
                                    });
                                });
                            });
                        }
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

function getWords(db) {
    const words = {};
    const stmt = db.prepare("SELECT WordID, Word FROM Word");
    while (stmt.step()) {
        const word = stmt.getAsObject()
        words[word.WordId] = word.Word
    }
    return words;
}

function getIndexes(db) {
    const searchIndexes = [];
    const stmt = db.prepare("SELECT WordID, TextUnitIndices, PositionalList, PositionalListIndex FROM SearchIndexDocument");
    while (stmt.step()) {
        const index = stmt.getAsObject()
        searchIndexes.push({
            WordID: index.WordId,
            PositionalList: index.PositionalList.toString().replace(/,/g, ' '),
            TextUnitIndices: index.TextUnitIndices.toString().replace(/,/g, ' '),
            PositionalListIndex: index.PositionalListIndex.toString().replace(/,/g, ' ')
        });
    }
    return searchIndexes;
}
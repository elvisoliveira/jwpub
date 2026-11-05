const dropArea = document.querySelector('.drag-area');
const dragText = document.querySelector('.header');
const input = dropArea.querySelector('input');
const reader = document.querySelector('#reader');

// Newly picked files replace whatever is on screen.
function openFiles(files) {
    reader.replaceChildren();
    window.scrollTo(0, 0);
    Array.from(files).forEach((file) => displayFile(file));
}

input.addEventListener('change', function() {
    dropArea.classList.add('active');
    openFiles(this.files);
    this.value = '';  // picking the same file again still fires "change"
});

// Floating button: opens the same file picker once the upload card is gone.
document.querySelector('#open-file').addEventListener('click', () => input.click());

dropArea.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropArea.classList.add('active');
    dragText.textContent = 'Release to open';
});

dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('active');
    dragText.textContent = 'Drag & Drop';
});

dropArea.addEventListener('drop', (event) => {
    event.preventDefault();
    openFiles(event.dataTransfer.files);
});

// Floating button: cycles the reader width; the choice survives reloads.
const widthToggle = document.querySelector('#width-toggle');
const WIDTHS = { narrow: 'Narrow', medium: 'Medium', wide: 'Wide', full: 'Full' };

function setWidth(mode) {
    reader.dataset.width = mode;
    widthToggle.textContent = `↔ ${WIDTHS[mode]}`;
    widthToggle.setAttribute('aria-label', `Content width: ${WIDTHS[mode]}`);
    localStorage.setItem('readerWidth', mode);
}

widthToggle.addEventListener('click', () => {
    const modes = Object.keys(WIDTHS);
    setWidth(modes[(modes.indexOf(reader.dataset.width) + 1) % modes.length]);
});

setWidth(localStorage.getItem('readerWidth') in WIDTHS ? localStorage.getItem('readerWidth') : 'medium');

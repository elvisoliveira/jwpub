const dropArea = document.querySelector('.drag-area');
const dragText = document.querySelector('.header');
const input = dropArea.querySelector('input');

input.addEventListener('change', function() {
    dropArea.classList.add('active');
    Array.from(this.files).forEach((file) => displayFile(file));
});

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
    Array.from(event.dataTransfer.files).forEach((file) => displayFile(file));
});

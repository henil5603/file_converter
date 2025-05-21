document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('editor');
    const saveTxtBtn = document.getElementById('saveTxtBtn');
    const savePdfBtn = document.getElementById('savePdfBtn');

    // Save content as TXT file
    saveTxtBtn.addEventListener('click', () => {
        const content = editor.value;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'document.txt');
    });

    // Save content as PDF file
    savePdfBtn.addEventListener('click', async () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text(editor.value, 10, 10);
        doc.save('document.pdf');
    });
});

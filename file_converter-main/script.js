document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const editor = document.getElementById('editor');
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveBtn');
    const conversionTypeSelect = document.getElementById('conversionType');

    let fileType;
    let originalContent = '';
    let originalFileName = '';

    // Handle file type selection
    conversionTypeSelect.addEventListener('change', function() {
        fileType = this.value;
        editor.value = '';
        fileInput.value = '';
        saveBtn.style.display = 'none';
        editBtn.style.display = 'none'; // Hide edit button initially
        if (fileType === 'pdfToTxt') {
            editor.setAttribute('readonly', true); // Make editor read-only for PDF content
        } else {
            editor.removeAttribute('readonly'); // Allow editing for TXT
        }
    });

    // Handle file input changes (load PDF or TXT)
    fileInput.addEventListener('change', function() {
        const file = this.files[0];
        originalFileName = file.name;
        const reader = new FileReader();

        reader.onload = async function(e) {
            if (file.name.endsWith('.pdf')) {
                fileType = 'pdf'; // Set file type to PDF
                // Convert PDF to text for editing
                const pdfBytes = new Uint8Array(e.target.result);
                const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
                let textContent = '';

                for (let i = 0; i < pdf.numPages; i++) {
                    const page = await pdf.getPage(i + 1);
                    const text = await page.getTextContent();
                    textContent += text.items.map(item => item.str).join(' ') + '\n';
                }

                originalContent = textContent;
                editor.value = textContent;
                editor.setAttribute('readonly', true); // PDF is initially read-only
                saveBtn.style.display = 'inline-block';
                editBtn.style.display = 'inline-block'; // Show Edit button
            } else if (file.name.endsWith('.txt')) {
                fileType = 'txt'; // Set file type to TXT
                // Load TXT and set to editor
                originalContent = e.target.result;
                editor.value = e.target.result;
                editor.removeAttribute('readonly'); // Allow editing for text files
                saveBtn.style.display = 'inline-block';
                editBtn.style.display = 'inline-block'; // Show Edit button
            }
        };

        if (file.name.endsWith('.pdf')) {
            reader.readAsArrayBuffer(file);
        } else if (file.name.endsWith('.txt')) {
            reader.readAsText(file);
        }
    });

    // Enable editing when Edit button is clicked
    editBtn.addEventListener('click', function() {
        editor.removeAttribute('readonly'); // Enable editing
        alert('You can now edit the content.');
    });

    // Save edited content in the original file format
    saveBtn.addEventListener('click', async function() {
        if (fileType === 'txt') {
            // Save as a TXT file
            const blob = new Blob([editor.value], { type: 'text/plain;charset=utf-8' });
            saveAs(blob, originalFileName);
        } else if (fileType === 'pdf') {
            // Save as a PDF file
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.text(editor.value, 10, 10);
            doc.save(originalFileName); // Save using the original PDF file name
        }
    });
});

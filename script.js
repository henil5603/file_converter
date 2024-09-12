document.getElementById('convertBtn').addEventListener('click', () => {
    const conversionType = document.getElementById('conversionType').value;
    const fileInput = document.getElementById('fileInput');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    if (conversionType === '') {
        alert('Please select a conversion type.');
        return;
    }

    if (fileInput.files.length === 0) {
        alert('Please select a file first.');
        return;
    }

    if (conversionType === 'pdfToTxt') {
        convertPdfToTxt(fileInput.files[0], progressBar, progressText);
    } else if (conversionType === 'txtToPdf') {
        convertTxtToPdf(fileInput.files[0], progressBar, progressText);
    }
});

function convertPdfToTxt(file, progressBar, progressText) {
    const fileReader = new FileReader();

    fileReader.onloadstart = function() {
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
    };

    fileReader.onprogress = function(event) {
        if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            progressBar.style.width = `${percent}%`;
            progressText.textContent = `${percent}%`;
        }
    };

    fileReader.onload = function(event) {
        const typedArray = new Uint8Array(event.target.result);
        pdfjsLib.getDocument(typedArray).promise.then(pdfDoc => {
            let txtContent = '';

            const pagesPromises = [];
            for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                pagesPromises.push(pdfDoc.getPage(pageNum).then(page => {
                    return page.getTextContent().then(textContent => {
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        txtContent += pageText + '\n';
                    });
                }));
            }

            Promise.all(pagesPromises).then(() => {
                const blob = new Blob([txtContent], {type: 'text/plain'});
                saveAs(blob, 'converted.txt');
            });
        });
    };

    fileReader.readAsArrayBuffer(file);
}

function convertTxtToPdf(file, progressBar, progressText) {
    const reader = new FileReader();

    reader.onloadstart = function() {
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
    };

    reader.onprogress = function(event) {
        if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            progressBar.style.width = `${percent}%`;
            progressText.textContent = `${percent}%`;
        }
    };

    reader.onload = function(event) {
        const text = event.target.result;
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();

        pdf.text(text, 10, 10);
        pdf.save('converted.pdf');
    };

    reader.readAsText(file);
}

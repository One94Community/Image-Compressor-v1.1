// DOM Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Single Image Compression Elements
const singleUploadArea = document.getElementById('single-upload-area');
const singleFileInput = document.getElementById('single-file-input');
const singleBrowseBtn = document.getElementById('single-browse-btn');
const singleQualitySlider = document.getElementById('single-quality-slider');
const singleQualityValue = document.getElementById('single-quality-value');
const singleCompressBtn = document.getElementById('single-compress-btn');
const singleProgressContainer = document.getElementById('single-progress-container');
const singleProgressBar = document.getElementById('single-compression-progress');
const singleProgressText = document.getElementById('single-progress-text');
const singlePreviewContainer = document.getElementById('single-preview-container');
const singleOriginalImg = document.getElementById('single-original-img');
const singleCompressedImg = document.getElementById('single-compressed-img');
const singleOriginalInfo = document.getElementById('single-original-info');
const singleCompressedInfo = document.getElementById('single-compressed-info');
const singleDownloadBtn = document.getElementById('single-download-btn');

// Bulk Image Compression Elements
const bulkUploadArea = document.getElementById('bulk-upload-area');
const bulkFileInput = document.getElementById('bulk-file-input');
const bulkBrowseBtn = document.getElementById('bulk-browse-btn');
const bulkQualitySlider = document.getElementById('bulk-quality-slider');
const bulkQualityValue = document.getElementById('bulk-quality-value');
const bulkClearBtn = document.getElementById('bulk-clear-btn');
const bulkCompressBtn = document.getElementById('bulk-compress-btn');
const bulkProgressContainer = document.getElementById('bulk-progress-container');
const bulkProgressBar = document.getElementById('bulk-compression-progress');
const bulkProgressText = document.getElementById('bulk-progress-text');
const bulkFileList = document.getElementById('bulk-file-list');
const bulkPreviewContainer = document.getElementById('bulk-preview-container');
const bulkDownloadBtn = document.getElementById('bulk-download-btn');

// Shared Elements
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');

// State Variables
let singleFile = null;
let singleCompressedBlob = null;
let bulkFiles = [];
let bulkCompressedFiles = [];

// Initialize the app
function init() {
    setupTabs();
    setupSingleImageCompression();
    setupBulkImageCompression();
}

// Set up tab functionality
function setupTabs() {
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(tabBtn => tabBtn.classList.remove('active'));
            btn.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            
            // Clear any messages when switching tabs
            errorMessage.textContent = '';
            successMessage.textContent = '';
        });
    });
}

// Set up single image compression functionality
function setupSingleImageCompression() {
    // Event listeners
    singleBrowseBtn.addEventListener('click', () => singleFileInput.click());
    
    singleUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        singleUploadArea.classList.add('active');
    });
    
    singleUploadArea.addEventListener('dragleave', () => {
        singleUploadArea.classList.remove('active');
    });
    
    singleUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        singleUploadArea.classList.remove('active');
        
        if (e.dataTransfer.files.length) {
            singleFileInput.files = e.dataTransfer.files;
            handleSingleFileSelect();
        }
    });
    
    singleFileInput.addEventListener('change', handleSingleFileSelect);
    singleQualitySlider.addEventListener('input', updateSingleQualityValue);
    singleCompressBtn.addEventListener('click', compressSingleImage);
    singleDownloadBtn.addEventListener('click', downloadSingleImage);
}

// Set up bulk image compression functionality
function setupBulkImageCompression() {
    // Event listeners
    bulkBrowseBtn.addEventListener('click', () => bulkFileInput.click());
    
    bulkUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        bulkUploadArea.classList.add('active');
    });
    
    bulkUploadArea.addEventListener('dragleave', () => {
        bulkUploadArea.classList.remove('active');
    });
    
    bulkUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        bulkUploadArea.classList.remove('active');
        
        if (e.dataTransfer.files.length) {
            bulkFileInput.files = e.dataTransfer.files;
            handleBulkFileSelect();
        }
    });
    
    bulkFileInput.addEventListener('change', handleBulkFileSelect);
    bulkQualitySlider.addEventListener('input', updateBulkQualityValue);
    bulkClearBtn.addEventListener('click', clearBulkFiles);
    bulkCompressBtn.addEventListener('click', compressBulkImages);
    bulkDownloadBtn.addEventListener('click', downloadBulkImagesAsZip);
}

// Handle single file selection
function handleSingleFileSelect() {
    const file = singleFileInput.files[0];
    
    // Validate file
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        showError('Please select an image file (JPEG, PNG, or WEBP)');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showError('File size too large. Maximum 5MB allowed.');
        return;
    }
    
    // Reset previous state
    singleFile = file;
    singleCompressedBlob = null;
    singlePreviewContainer.style.display = 'none';
    singleCompressBtn.disabled = false;
    errorMessage.textContent = '';
    successMessage.textContent = '';
    
    // Display original image
    const reader = new FileReader();
    reader.onload = function(e) {
        singleOriginalImg.src = e.target.result;
        
        // Get image dimensions
        const img = new Image();
        img.onload = function() {
            singleOriginalInfo.textContent = `Size: ${formatFileSize(file.size)} | Dimensions: ${img.width}×${img.height} | Type: ${file.type}`;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Handle bulk file selection
function handleBulkFileSelect() {
    const newFiles = Array.from(bulkFileInput.files);
    
    // Validate files
    const validFiles = validateFiles(newFiles);
    
    if (validFiles.length === 0) {
        if (newFiles.length > 0) {
            showError('No valid images selected. Please select JPEG, PNG, or WEBP files under 5MB.');
        }
        return;
    }
    
    // Add valid files to our files array
    addBulkFiles(validFiles);
}

// Validate selected files for bulk compression
function validateFiles(newFiles) {
    return newFiles.filter(file => {
        // Check if file is an image
        if (!file.type.match('image.*')) {
            showError(`Skipped non-image file: ${file.name}`);
            return false;
        }
        
        // Check file size
        if (file.size > 5 * 1024 * 1024) {
            showError(`Skipped large file: ${file.name} (max 5MB)`);
            return false;
        }
        
        // Check if file already exists
        if (bulkFiles.some(f => 
            f.name === file.name && 
            f.size === file.size && 
            f.lastModified === file.lastModified
        )) {
            showError(`Skipped duplicate file: ${file.name}`);
            return false;
        }
        
        // Check total files limit
        if (bulkFiles.length + newFiles.length > 20) {
            showError('Maximum 20 files allowed. You can add ' + (20 - bulkFiles.length) + ' more files.');
            return false;
        }
        
        return true;
    });
}

// Add valid files to bulk files array
function addBulkFiles(validFiles) {
    bulkFiles = [...bulkFiles, ...validFiles];
    errorMessage.textContent = '';
    successMessage.textContent = '';
    updateBulkFileList();
    updateBulkControls();
}

// Update bulk file list display
function updateBulkFileList() {
    bulkFileList.innerHTML = '';
    bulkFileList.style.display = bulkFiles.length ? 'block' : 'none';
    
    bulkFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        fileItem.innerHTML = `
            <span class="file-name" title="${file.name}">${file.name}</span>
            <span class="file-size">${formatFileSize(file.size)}</span>
            <button class="remove-btn" data-index="${index}">×</button>
        `;
        
        bulkFileList.appendChild(fileItem);
    });
    
    // Add event listeners to remove buttons
    document.querySelectorAll('#bulk-file-list .remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            removeBulkFile(index);
        });
    });
}

// Remove a file from bulk list
function removeBulkFile(index) {
    bulkFiles.splice(index, 1);
    updateBulkFileList();
    updateBulkControls();
    
    // Remove corresponding preview if exists
    const previewBox = document.getElementById(`bulk-preview-${index}`);
    if (previewBox) previewBox.remove();
    
    if (bulkFiles.length === 0) {
        clearBulkFiles();
    }
}

// Clear all bulk files
function clearBulkFiles() {
    bulkFiles = [];
    bulkCompressedFiles = [];
    bulkPreviewContainer.innerHTML = '';
    bulkFileList.style.display = 'none';
    bulkDownloadBtn.style.display = 'none';
    updateBulkControls();
    errorMessage.textContent = '';
    successMessage.textContent = '';
    bulkFileInput.value = '';
}

// Update bulk controls state
function updateBulkControls() {
    bulkClearBtn.disabled = bulkFiles.length === 0;
    bulkCompressBtn.disabled = bulkFiles.length === 0;
}

// Update single quality value display
function updateSingleQualityValue() {
    singleQualityValue.textContent = singleQualitySlider.value;
}

// Update bulk quality value display
function updateBulkQualityValue() {
    bulkQualityValue.textContent = bulkQualitySlider.value;
}

// Compress single image
function compressSingleImage() {
    if (!singleFile) return;
    
    singleProgressContainer.style.display = 'block';
    singleProgressBar.value = 0;
    singleProgressText.textContent = 'Compressing...';
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
        if (singleProgressBar.value < 90) {
            singleProgressBar.value += 10;
        }
    }, 100);
    
    setTimeout(() => {
        const quality = parseInt(singleQualitySlider.value);
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Calculate new dimensions
                const { width, height } = calculateDimensions(img);
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw image on canvas
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to JPEG
                canvas.toBlob(function(blob) {
                    clearInterval(progressInterval);
                    singleProgressBar.value = 100;
                    singleProgressText.textContent = 'Complete!';
                    
                    setTimeout(() => {
                        singleProgressContainer.style.display = 'none';
                    }, 500);
                    
                    singleCompressedBlob = blob;
                    const compressedUrl = URL.createObjectURL(blob);
                    singleCompressedImg.src = compressedUrl;
                    
                    // Show compressed file info
                    singleCompressedInfo.textContent = `Size: ${formatFileSize(blob.size)} | Dimensions: ${width}×${height} | Quality: ${quality}%`;
                    
                    singlePreviewContainer.style.display = 'block';
                    singleDownloadBtn.href = compressedUrl;
                    singleDownloadBtn.download = `compressed_${singleFile.name.replace(/\.[^/.]+$/, '')}.jpg`;
                    
                    successMessage.textContent = 'Image compressed successfully!';
                    
                    // If the compressed image is still too large (>150KB), suggest lower quality
                    if (blob.size > 150 * 1024 && quality > 30) {
                        showError('Image is still large. Try lowering the quality more.');
                    }
                }, 'image/jpeg', quality / 100);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(singleFile);
    }, 300);
}

// Compress all bulk images
function compressBulkImages() {
    if (bulkFiles.length === 0) return;
    
    bulkPreviewContainer.innerHTML = '';
    bulkCompressedFiles = [];
    bulkDownloadBtn.style.display = 'none';
    
    showBulkProgress(0, bulkFiles.length);
    
    const quality = parseInt(bulkQualitySlider.value);
    let processed = 0;
    
    // Process files with small delay between each to prevent UI freezing
    bulkFiles.forEach((file, index) => {
        setTimeout(() => {
            compressBulkFile(file, index, quality).then(() => {
                processed++;
                updateBulkProgress(processed, bulkFiles.length);
                
                if (processed === bulkFiles.length) {
                    bulkCompressionComplete();
                }
            }).catch(error => {
                console.error('Error compressing file:', error);
                showError(`Error processing ${file.name}`);
                processed++;
                updateBulkProgress(processed, bulkFiles.length);
                
                if (processed === bulkFiles.length) {
                    bulkCompressionComplete();
                }
            });
        }, index * 100);
    });
}

// Compress a single file in bulk operation
function compressBulkFile(file, index, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const img = new Image();
            
            img.onload = function() {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Calculate new dimensions
                    const { width, height } = calculateDimensions(img);
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Draw image on canvas
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convert to JPEG
                    canvas.toBlob(function(blob) {
                        if (!blob) {
                            reject(new Error('Compression failed'));
                            return;
                        }
                        
                        const compressedUrl = URL.createObjectURL(blob);
                        const compressedName = generateCompressedFileName(file.name);
                        
                        // Add to compressed files array
                        bulkCompressedFiles.push({
                            name: compressedName,
                            blob: blob,
                            url: compressedUrl,
                            size: blob.size,
                            originalSize: file.size,
                            width: width,
                            height: height
                        });
                        
                        // Create preview box
                        createBulkPreviewBox(index, file, img, compressedUrl, blob, width, height);
                        
                        resolve();
                    }, 'image/jpeg', quality / 100);
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = function() {
                reject(new Error('Image loading failed'));
            };
            
            img.src = event.target.result;
        };
        
        reader.onerror = function() {
            reject(new Error('File reading failed'));
        };
        
        reader.readAsDataURL(file);
    });
}

// Calculate new image dimensions
function calculateDimensions(img) {
    let width = img.width;
    let height = img.height;
    
    const MAX_DIMENSION = 2000;
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
        } else {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
        }
    }
    
    return { width, height };
}

// Generate compressed file name
function generateCompressedFileName(originalName) {
    const extension = originalName.split('.').pop();
    return `compressed_${originalName.replace(`.${extension}`, '')}.jpg`;
}

// Create preview box for bulk compressed image
function createBulkPreviewBox(index, originalFile, originalImg, compressedUrl, compressedBlob, width, height) {
    const previewBox = document.createElement('div');
    previewBox.className = 'compressed-item';
    previewBox.id = `bulk-preview-${index}`;
    
    previewBox.innerHTML = `
        <h4 title="${originalFile.name}">${originalFile.name}</h4>
        <div class="compressed-comparison">
            <div>
                <img src="${originalImg.src}" alt="Original">
                <div class="compressed-info">Original: ${formatFileSize(originalFile.size)}<br>
                ${originalImg.width}×${originalImg.height}</div>
            </div>
            <div>
                <img src="${compressedUrl}" alt="Compressed">
                <div class="compressed-info">Compressed: ${formatFileSize(compressedBlob.size)}<br>
                ${width}×${height}</div>
            </div>
        </div>
        <a href="${compressedUrl}" download="compressed_${originalFile.name}" class="btn download-btn">
            Download
        </a>
    `;
    
    bulkPreviewContainer.appendChild(previewBox);
}

// Download single compressed image
function downloadSingleImage(e) {
    if (singleCompressedBlob) {
        const url = URL.createObjectURL(singleCompressedBlob);
        singleDownloadBtn.href = url;
        singleDownloadBtn.download = `compressed_${singleFile.name.replace(/\.[^/.]+$/, '')}.jpg`;
    } else {
        e.preventDefault();
        showError('Please compress the image first');
    }
}

// Download all bulk compressed images as ZIP
function downloadBulkImagesAsZip() {
    if (bulkCompressedFiles.length === 0) return;
    
    showBulkProgress(0, bulkCompressedFiles.length, 'Preparing ZIP');
    
    const zip = new JSZip();
    const folder = zip.folder("compressed_images");
    let added = 0;
    
    bulkCompressedFiles.forEach((file) => {
        folder.file(file.name, file.blob);
        added++;
        updateBulkProgress(added, bulkCompressedFiles.length, 'Preparing ZIP');
        
        if (added === bulkCompressedFiles.length) {
            zip.generateAsync({ type: "blob" })
                .then(function(content) {
                    saveAs(content, "compressed_images.zip");
                    hideBulkProgress();
                })
                .catch(error => {
                    console.error('Error creating ZIP:', error);
                    showError('Error creating ZIP file');
                    hideBulkProgress();
                });
        }
    });
}

// Show bulk progress
function showBulkProgress(current, total, action = 'Compressing') {
    bulkProgressContainer.style.display = 'block';
    bulkProgressBar.value = (current / total) * 100;
    bulkProgressText.textContent = `${action} (${current}/${total})`;
}

// Update bulk progress
function updateBulkProgress(current, total, action = 'Compressing') {
    bulkProgressBar.value = (current / total) * 100;
    bulkProgressText.textContent = `${action} (${current}/${total})`;
}

// Hide bulk progress
function hideBulkProgress() {
    setTimeout(() => {
        bulkProgressContainer.style.display = 'none';
    }, 500);
}

// Bulk compression complete handler
function bulkCompressionComplete() {
    hideBulkProgress();
    bulkDownloadBtn.style.display = 'block';
    successMessage.textContent = 'All images compressed successfully!';
}

// Format file size for display
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    setTimeout(() => {
        errorMessage.textContent = '';
    }, 5000);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', init);
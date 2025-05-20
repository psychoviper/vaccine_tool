/**
 * File upload functionality for BioPipeline
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeFileUpload();
  });
  
  /**
   * Initialize file upload functionality
   */
  function initializeFileUpload() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fasta-upload');
    const uploadStatus = document.getElementById('uploadStatus');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const removeFileBtn = document.getElementById('removeFile');
    const uploadSubmitBtn = document.getElementById('uploadSubmit');
    
    if (!dropArea || !fileInput) return;
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, preventDefaults, false);
      document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
      dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);
    
    // Handle file input change
    fileInput.addEventListener('change', handleFiles, false);
    
    // Handle click on drop area
    dropArea.addEventListener('click', function(e) {
      if (e.target.closest('label')) return;
      fileInput.click();
    });
    
    // Handle remove file button
    removeFileBtn.addEventListener('click', function() {
      resetFileUpload();
    });
    
    /**
     * Prevent default drag and drop behaviors
     * @param {Event} e - The event object
     */
    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    /**
     * Add highlight class to drop area
     */
    function highlight() {
      dropArea.classList.add('drag-over');
    }
    
    /**
     * Remove highlight class from drop area
     */
    function unhighlight() {
      dropArea.classList.remove('drag-over');
    }
    
    /**
     * Handle dropped files
     * @param {DragEvent} e - The drag event
     */
    function handleDrop(e) {
      const dt = e.dataTransfer;
      const files = dt.files;
      
      if (files.length) {
        handleFile(files[0]);
      }
    }
    
    /**
     * Handle selected files from file input
     * @param {Event} e - The change event
     */
    function handleFiles(e) {
      const files = e.target.files;
      
      if (files.length) {
        handleFile(files[0]);
      }
    }
    
    /**
     * Process the uploaded file
     * @param {File} file - The uploaded file
     */
    function handleFile(file) {
      // Check if file is a FASTA file (by extension or type)
      const validExtensions = ['.fasta', '.fa', '.txt'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        alert('Please upload a valid FASTA file (.fasta, .fa, or .txt)');
        return;
      }
      
      // Update UI
      fileName.textContent = file.name;
      fileSize.textContent = `(${formatFileSize(file.size)})`;
      dropArea.style.display = 'none';
      uploadStatus.style.display = 'flex';
      uploadSubmitBtn.disabled = false;
      
      // Parse FASTA file to count sequences
      const reader = new FileReader();
      
      reader.onload = function(e) {
        const content = e.target.result;
        const sequenceCount = countFastaSequences(content);
        
        // Store sequence count for next step
        sessionStorage.setItem('sequenceCount', sequenceCount);
        
        // Store a sample of the file content for demo purposes
        const contentSample = content.substring(0, 1000);
        sessionStorage.setItem('fastaContentSample', contentSample);
      };
      
      reader.readAsText(file);
    }
    
    /**
     * Reset the file upload form
     */
    function resetFileUpload() {
      fileInput.value = '';
      dropArea.style.display = 'block';
      uploadStatus.style.display = 'none';
      uploadSubmitBtn.disabled = true;
      sessionStorage.removeItem('sequenceCount');
      sessionStorage.removeItem('fastaContentSample');
    }
    
    /**
     * Format file size in human-readable format
     * @param {number} bytes - The file size in bytes
     * @returns {string} Formatted file size
     */
    function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    /**
     * Count the number of sequences in a FASTA file
     * @param {string} content - The FASTA file content
     * @returns {number} The number of sequences
     */
    function countFastaSequences(content) {
      // Count the number of ">" characters which indicate sequence headers
      return (content.match(/^>/gm) || []).length;
    }
  }
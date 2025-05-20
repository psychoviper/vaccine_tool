/**
 * Sequence analysis functionality for BioPipeline
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeSequenceAnalysis();
  });
  
  /**
   * Initialize sequence analysis functionality
   */
  function initializeSequenceAnalysis() {
    setupSequenceInfo();
    setupDownloadButtons();
  }
  
  /**
   * Set up sequence information display
   */
  function setupSequenceInfo() {
    const sequenceCountElement = document.getElementById('sequenceCount');
    const endSequenceInput = document.getElementById('endSequence');
    
    if (!sequenceCountElement || !endSequenceInput) return;
    
    // When navigating to step 2, update the sequence count from storage
    document.getElementById('uploadSubmit')?.addEventListener('click', function() {
      const sequenceCount = parseInt(sessionStorage.getItem('sequenceCount') || '0');
      
      // Update displayed sequence count
      sequenceCountElement.textContent = sequenceCount;
      
      // Set end sequence input value to total count
      endSequenceInput.value = sequenceCount;
      endSequenceInput.max = sequenceCount;
    });
    
    // Set up sequence range validation
    const startSequenceInput = document.getElementById('startSequence');
    
    if (startSequenceInput && endSequenceInput) {
      startSequenceInput.addEventListener('change', validateSequenceRange);
      endSequenceInput.addEventListener('change', validateSequenceRange);
    }
    
    /**
     * Validate the sequence range inputs
     */
    function validateSequenceRange() {
      const start = parseInt(startSequenceInput.value);
      const end = parseInt(endSequenceInput.value);
      const maxCount = parseInt(sessionStorage.getItem('sequenceCount') || '0');
      
      // Ensure start is at least 1
      if (start < 1) {
        startSequenceInput.value = 1;
      }
      
      // Ensure end doesn't exceed max
      if (end > maxCount) {
        endSequenceInput.value = maxCount;
      }
      
      // Ensure start doesn't exceed end
      if (start > end) {
        startSequenceInput.value = end;
      }
    }
  }
  
  /**
   * Set up download buttons functionality
   */
  function setupDownloadButtons() {
  //   const downloadButtons = document.querySelectorAll('.btn-download');
    
  //   downloadButtons.forEach(button => {
  //     button.addEventListener('click', function() {
  //       const fileInfo = this.closest('.file-card').querySelector('.file-info h4').textContent;
  //       const fileType = this.closest('.file-card').dataset.type;
        
  //       downloadMockFile(fileInfo, fileType);
  //     });
  //   });
    
    // Step-specific download buttons
    document.getElementById('downloadStep2')?.addEventListener('click', function() {
      window.location.href = "/download/step2";
    });
    
    document.getElementById('downloadStep3')?.addEventListener('click', function() {
      window.location.href = "/download/step3";
    });
    
    document.getElementById('downloadStep4')?.addEventListener('click', function() {
      window.location.href = "/download/step4";
    });
    
    document.getElementById('downloadStep5')?.addEventListener('click', function() {
      window.location.href = "/download/step5";
    });
    
    // Step-specific download buttons
    document.getElementById('download_Step2')?.addEventListener('click', function() {
      window.location.href = "/download/step2";
    });
    
    document.getElementById('download_Step3')?.addEventListener('click', function() {
      window.location.href = "/download/step3";
    });
    
    document.getElementById('download_Step4')?.addEventListener('click', function() {
      window.location.href = "/download/step4";
    });
    
    document.getElementById('download_Step5')?.addEventListener('click', function() {
      window.location.href = "/download/step5";
    });
  }
  
  /**
   * Generate and download a mock file
   * @param {string} fileName - The name of the file
   * @param {string} fileType - The type of file (fasta, csv, pdf)
   */
  function downloadMockFile(fileName, fileType) {
    let content = '';
    let mimeType = '';
    let fileExtension = '';
    
    switch (fileType) {
      case 'fasta':
        content = generateMockFastaContent();
        mimeType = 'text/plain';
        fileExtension = 'fasta';
        break;
      case 'csv':
        content = generateMockCsvContent(fileName);
        mimeType = 'text/csv';
        fileExtension = 'csv';
        break;
      case 'pdf':
        // For PDF, we'll just show an alert since we can't easily generate PDFs
        alert('PDF download would start here in a production environment.');
        return;
      default:
        content = 'Mock file content';
        mimeType = 'text/plain';
        fileExtension = 'txt';
    }
    
    // Create file and download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `${fileName.replace(/\s+/g, '_')}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
  
  /**
   * Generate mock FASTA content
   * @returns {string} Mock FASTA content
   */
  function generateMockFastaContent() {
    const sampleContent = sessionStorage.getItem('fastaContentSample');
    
    if (sampleContent) {
      return sampleContent;
    }
    
    // Generate mock FASTA if no sample is available
    let content = '';
    const sequenceCount = 5;
    
    for (let i = 1; i <= sequenceCount; i++) {
      content += `>Sequence_${i}\n`;
      
      // Generate a random amino acid sequence
      let sequence = '';
      const aminoAcids = 'ACDEFGHIKLMNPQRSTVWY';
      const sequenceLength = Math.floor(Math.random() * 50) + 50; // 50-100 amino acids
      
      for (let j = 0; j < sequenceLength; j++) {
        sequence += aminoAcids.charAt(Math.floor(Math.random() * aminoAcids.length));
        
        // Add newline every 60 characters for readability
        if ((j + 1) % 60 === 0) {
          sequence += '\n';
        }
      }
      
      content += sequence + '\n\n';
    }
    
    return content;
  }
  
  /**
   * Generate mock CSV content based on file name
   * @param {string} fileName - The name of the file
   * @returns {string} Mock CSV content
   */
  function generateMockCsvContent(fileName) {
    let content = '';
    
    if (fileName.includes('AlgPred')) {
      content = 'Sequence_ID,Allergenicity_Score,Prediction,Method\n';
      for (let i = 1; i <= 10; i++) {
        const score = (Math.random() * 0.8 + 0.1).toFixed(3);
        const prediction = parseFloat(score) > 0.5 ? 'Allergen' : 'Non-allergen';
        content += `Sequence_${i},${score},${prediction},Hybrid\n`;
      }
    } else if (fileName.includes('VaxiJen')) {
      content = 'Sequence_ID,Antigenicity_Score,Prediction,Target_Organism\n';
      for (let i = 1; i <= 10; i++) {
        const score = (Math.random() * 0.6 + 0.2).toFixed(3);
        const prediction = parseFloat(score) > 0.4 ? 'Antigen' : 'Non-antigen';
        content += `Sequence_${i},${score},${prediction},Virus\n`;
      }
    } else if (fileName.includes('Phobius')) {
      content = 'Sequence_ID,TM_Helices,Signal_Peptide,Cytoplasmic_Regions\n';
      for (let i = 1; i <= 10; i++) {
        const tmHelices = Math.floor(Math.random() * 3);
        const signalPeptide = Math.random() > 0.7 ? 'YES' : 'NO';
        const cytoRegions = Math.floor(Math.random() * 4);
        content += `Sequence_${i},${tmHelices},${signalPeptide},${cytoRegions}\n`;
      }
    } else if (fileName.includes('Epitope')) {
      content = 'Epitope_ID,Sequence,Type,Start_Position,End_Position,Score\n';
      for (let i = 1; i <= 15; i++) {
        const types = ['B-Cell', 'T-Cell', 'MHC-I', 'MHC-II'];
        const type = types[Math.floor(Math.random() * types.length)];
        const sequence = generateRandomAminoAcidSequence(9);
        const start = Math.floor(Math.random() * 200) + 1;
        const end = start + 8;
        const score = (Math.random() * 0.5 + 0.5).toFixed(3);
        content += `EP${i},${sequence},${type},${start},${end},${score}\n`;
      }
    } else if (fileName.includes('Property') || fileName.includes('Results')) {
      content = 'ID,Allergenicity,Antigenicity,Toxicity,Viable\n';
      for (let i = 1; i <= 10; i++) {
        const allergenicity = (Math.random() * 0.4).toFixed(3);
        const antigenicity = (Math.random() * 0.5 + 0.5).toFixed(3);
        const toxicity = (Math.random() * 0.3).toFixed(3);
        const viable = parseFloat(allergenicity) < 0.3 && parseFloat(antigenicity) > 0.6 && parseFloat(toxicity) < 0.2 ? 'YES' : 'NO';
        content += `Sample_${i},${allergenicity},${antigenicity},${toxicity},${viable}\n`;
      }
    } else {
      // Generic CSV
      content = 'ID,Name,Value,Score\n';
      for (let i = 1; i <= 10; i++) {
        content += `${i},Item_${i},Value_${i},${(Math.random() * 100).toFixed(2)}\n`;
      }
    }
    
    return content;
  }
  
  /**
   * Generate a random amino acid sequence of the specified length
   * @param {number} length - The length of the sequence to generate
   * @returns {string} A random amino acid sequence
   */
  function generateRandomAminoAcidSequence(length) {
    const aminoAcids = ['A', 'R', 'N', 'D', 'C', 'E', 'Q', 'G', 'H', 'I', 'L', 'K', 'M', 'F', 'P', 'S', 'T', 'W', 'Y', 'V'];
    let sequence = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * aminoAcids.length);
      sequence += aminoAcids[randomIndex];
    }
    
    return sequence;
  }
/**
 * Epitope prediction functionality for BioPipeline
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeEpitopePrediction();
  });
  
  /**
   * Initialize epitope prediction functionality
   */
  function initializeEpitopePrediction() {
    setupNestedDropdowns();
    setupEpitopeTable();
  }
  
  /**
   * Set up nested dropdowns for MHC alleles
   */
  function setupNestedDropdowns() {
    const mhc1AlleleSelect = document.getElementById('netmhci-allele');
    const mhc2AlleleSelect = document.getElementById('netmhcii-allele');
    
    if (mhc1AlleleSelect) {
      mhc1AlleleSelect.addEventListener('change', function() {
        updateNestedDropdown(this.value, 'MHC-I');
      });
    }
    
    if (mhc2AlleleSelect) {
      mhc2AlleleSelect.addEventListener('change', function() {
        updateNestedDropdown(this.value, 'MHC-II');
      });
    }
    
    /**
     * Update the nested dropdown based on parent selection
     * @param {string} parentValue - The selected value from the parent dropdown
     * @param {string} mhcClass - The MHC class (MHC-I or MHC-II)
     */
    function updateNestedDropdown(parentValue, mhcClass) {
      // Hide all nested dropdowns
      const nestedDropdowns = document.querySelectorAll(`.nested-dropdown[id$="-options"]`);
      nestedDropdowns.forEach(dropdown => {
        dropdown.style.display = 'none';
      });
      
      // Show the selected dropdown
      const targetDropdown = document.getElementById(`${parentValue}-options`);
      if (targetDropdown) {
        targetDropdown.style.display = 'block';
        
        // Update the specific allele options based on parent
        const specificSelect = targetDropdown.querySelector('select');
        
        if (specificSelect) {
          specificSelect.innerHTML = '';
          
          let options = [];
          
          if (mhcClass === 'MHC-I') {
            switch (parentValue) {
              case 'HLA-A':
                options = [
                  { value: 'A*01:01', text: 'A*01:01' },
                  { value: 'A*02:01', text: 'A*02:01' },
                  { value: 'A*03:01', text: 'A*03:01' },
                  { value: 'A*11:01', text: 'A*11:01' },
                  { value: 'A*24:02', text: 'A*24:02' }
                ];
                break;
              case 'HLA-B':
                options = [
                  { value: 'B*07:02', text: 'B*07:02' },
                  { value: 'B*08:01', text: 'B*08:01' },
                  { value: 'B*15:01', text: 'B*15:01' },
                  { value: 'B*27:05', text: 'B*27:05' },
                  { value: 'B*40:01', text: 'B*40:01' }
                ];
                break;
              case 'HLA-C':
                options = [
                  { value: 'C*03:03', text: 'C*03:03' },
                  { value: 'C*04:01', text: 'C*04:01' },
                  { value: 'C*05:01', text: 'C*05:01' },
                  { value: 'C*07:01', text: 'C*07:01' },
                  { value: 'C*07:02', text: 'C*07:02' }
                ];
                break;
            }
          } else if (mhcClass === 'MHC-II') {
            switch (parentValue) {
              case 'HLA-DRB1':
                options = [
                  { value: 'DRB1*01:01', text: 'DRB1*01:01' },
                  { value: 'DRB1*03:01', text: 'DRB1*03:01' },
                  { value: 'DRB1*04:01', text: 'DRB1*04:01' },
                  { value: 'DRB1*07:01', text: 'DRB1*07:01' },
                  { value: 'DRB1*15:01', text: 'DRB1*15:01' }
                ];
                break;
              case 'HLA-DPA1':
                options = [
                  { value: 'DPA1*01:03-DPB1*02:01', text: 'DPA1*01:03-DPB1*02:01' },
                  { value: 'DPA1*01:03-DPB1*04:01', text: 'DPA1*01:03-DPB1*04:01' },
                  { value: 'DPA1*02:01-DPB1*01:01', text: 'DPA1*02:01-DPB1*01:01' },
                  { value: 'DPA1*03:01-DPB1*04:02', text: 'DPA1*03:01-DPB1*04:02' }
                ];
                break;
              case 'HLA-DQA1':
                options = [
                  { value: 'DQA1*01:01-DQB1*05:01', text: 'DQA1*01:01-DQB1*05:01' },
                  { value: 'DQA1*01:02-DQB1*06:02', text: 'DQA1*01:02-DQB1*06:02' },
                  { value: 'DQA1*03:01-DQB1*03:02', text: 'DQA1*03:01-DQB1*03:02' },
                  { value: 'DQA1*05:01-DQB1*02:01', text: 'DQA1*05:01-DQB1*02:01' }
                ];
                break;
            }
          }
          
          // Add the options to the select
          options.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option.value;
            optionEl.textContent = option.text;
            specificSelect.appendChild(optionEl);
          });
        }
      }
    }
    
    // Initial call to set up dropdowns
    if (mhc1AlleleSelect) {
      updateNestedDropdown(mhc1AlleleSelect.value, 'MHC-I');
    }
    
    if (mhc2AlleleSelect) {
      updateNestedDropdown(mhc2AlleleSelect.value, 'MHC-II');
    }
  }
  
  /**
   * Set up epitope table with mock data
   */
  function setupEpitopeTable() {
    // Will be populated by main.js when "Submit for Epitope Prediction" is clicked
  }
  
  /**
   * Generate mock epitope data for display
   * @returns {Array} Array of mock epitope data objects
   */
  function generateMockEpitopeData() {
    const epitopeTypes = ['B-Cell', 'T-Cell', 'MHC-I', 'MHC-II'];
    const epitopes = [];
    
    for (let i = 1; i <= 15; i++) {
      const typeIndex = Math.floor(Math.random() * epitopeTypes.length);
      const sequence = generateRandomAminoAcidSequence(9);
      const position = Math.floor(Math.random() * 200) + 1;
      const score = (Math.random() * 0.5 + 0.5).toFixed(2);
      
      epitopes.push({
        id: `EP${i}`,
        type: epitopeTypes[typeIndex],
        sequence: sequence,
        position: position,
        score: score
      });
    }
    
    return epitopes;
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
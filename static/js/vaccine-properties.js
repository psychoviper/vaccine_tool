/**
 * Vaccine properties functionality for BioPipeline
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeVaccineProperties();
  });
  
  /**
   * Initialize vaccine properties functionality
   */
  function initializeVaccineProperties() {
    setupPropertyForms();
  }
  
  /**
   * Set up property analysis forms
   */
  function setupPropertyForms() {
    // Setup allergenicity method dropdown
    const allergenicityMethod = document.getElementById('allergenicity-method');
    
    if (allergenicityMethod) {
      allergenicityMethod.addEventListener('change', function() {
        // Different threshold ranges based on method
        const thresholdInput = document.getElementById('allergenicity-threshold');
        
        if (thresholdInput) {
          switch (this.value) {
            case 'sequence':
              thresholdInput.min = '0';
              thresholdInput.max = '1';
              thresholdInput.step = '0.01';
              thresholdInput.value = '0.6';
              break;
            case 'structure':
              thresholdInput.min = '0';
              thresholdInput.max = '0.8';
              thresholdInput.step = '0.01';
              thresholdInput.value = '0.4';
              break;
            case 'hybrid':
              thresholdInput.min = '0';
              thresholdInput.max = '1';
              thresholdInput.step = '0.01';
              thresholdInput.value = '0.5';
              break;
          }
          
          // Update the displayed value
          const valueDisplay = document.getElementById('allergenicity-threshold-value');
          if (valueDisplay) {
            valueDisplay.textContent = thresholdInput.value;
          }
        }
      });
    }
    
    // Setup antigenicity method dropdown
    const antigenicityMethod = document.getElementById('antigenicity-method');
    
    if (antigenicityMethod) {
      antigenicityMethod.addEventListener('change', function() {
        // Update threshold based on method
        const thresholdInput = document.getElementById('antigenicity-threshold');
        
        if (thresholdInput) {
          switch (this.value) {
            case 'vaxijen':
              thresholdInput.min = '0.3';
              thresholdInput.max = '0.9';
              thresholdInput.step = '0.01';
              thresholdInput.value = '0.5';
              break;
            case 'antig-pred':
              thresholdInput.min = '0';
              thresholdInput.max = '1';
              thresholdInput.step = '0.01';
              thresholdInput.value = '0.7';
              break;
          }
          
          // Update the displayed value
          const valueDisplay = document.getElementById('antigenicity-threshold-value');
          if (valueDisplay) {
            valueDisplay.textContent = thresholdInput.value;
          }
        }
      });
    }
    
    // Setup toxicity method dropdown
    const toxinPredMethod = document.getElementById('toxinpred-method');
    
    if (toxinPredMethod) {
      toxinPredMethod.addEventListener('change', function() {
        // Update threshold based on method
        const thresholdInput = document.getElementById('toxinpred-threshold');
        
        if (thresholdInput) {
          switch (this.value) {
            case 'svm':
              thresholdInput.min = '0';
              thresholdInput.max = '1';
              thresholdInput.step = '0.01';
              thresholdInput.value = '0.5';
              break;
            case 'motif':
              thresholdInput.min = '0';
              thresholdInput.max = '0.8';
              thresholdInput.step = '0.01';
              thresholdInput.value = '0.4';
              break;
          }
          
          // Update the displayed value
          const valueDisplay = document.getElementById('toxinpred-threshold-value');
          if (valueDisplay) {
            valueDisplay.textContent = thresholdInput.value;
          }
        }
      });
    }
  }
  
  /**
   * Generate mock property data for a set of epitopes
   * @param {number} count - Number of epitopes to generate data for
   * @returns {Array} Array of property data objects
   */
  function generateMockPropertyData(count) {
    const properties = [];
    
    for (let i = 1; i <= count; i++) {
      const allergenicity = (Math.random() * 0.4).toFixed(2);
      const antigenicity = (Math.random() * 0.5 + 0.5).toFixed(2);
      const toxicity = (Math.random() * 0.3).toFixed(2);
      
      // Determine if epitope is viable based on thresholds
      const isAllergen = parseFloat(allergenicity) < 0.3;
      const isAntigen = parseFloat(antigenicity) > 0.6;
      const isToxic = parseFloat(toxicity) < 0.2;
      const isViable = isAllergen && isAntigen && isToxic;
      
      properties.push({
        id: `EP${i}`,
        allergenicity: allergenicity,
        antigenicity: antigenicity,
        toxicity: toxicity,
        viable: isViable
      });
    }
    
    return properties;
  }
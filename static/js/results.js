/**
 * Results functionality for BioPipeline
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeResults();
  });
  
  /**
   * Initialize results functionality
   */
  function initializeResults() {
    document.getElementById('goToStep5')?.addEventListener('click', function() {
      // Create chart when navigating to final results
      createEpitopeChart();
    });
  }
  
  /**
   * Create a chart for epitope visualization
   */
  function createEpitopeChart() {
    // In a real application, this would use a charting library like Chart.js
    // For this demo, we'll create a placeholder for the chart
    const chartContainer = document.querySelector('.chart-container');
    
    if (chartContainer) {
      // Create a sample chart visualization
      chartContainer.innerHTML = `
        <div class="mock-chart">
          <div class="chart-title">Epitope Distribution by Type</div>
          <div class="chart-bars">
            <div class="chart-bar" style="height: ${getRandomNumber(30, 100)}px;" data-type="B-Cell"></div>
            <div class="chart-bar" style="height: ${getRandomNumber(30, 100)}px;" data-type="T-Cell"></div>
            <div class="chart-bar" style="height: ${getRandomNumber(30, 100)}px;" data-type="MHC-I"></div>
            <div class="chart-bar" style="height: ${getRandomNumber(10, 50)}px;" data-type="MHC-II"></div>
          </div>
          <div class="chart-labels">
            <div class="chart-label">B-Cell</div>
            <div class="chart-label">T-Cell</div>
            <div class="chart-label">MHC-I</div>
            <div class="chart-label">MHC-II</div>
          </div>
        </div>
      `;
      
      // Add styles for the mock chart
      const style = document.createElement('style');
      style.textContent = `
        .mock-chart {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .chart-title {
          font-weight: bold;
          margin-bottom: 20px;
          color: var(--primary-color);
        }
        
        .chart-bars {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          height: 200px;
          width: 100%;
          margin-bottom: 10px;
        }
        
        .chart-bar {
          width: 60px;
          background-color: var(--secondary-color);
          border-radius: 4px 4px 0 0;
          position: relative;
          transition: height 1s ease-out;
        }
        
        .chart-bar[data-type="B-Cell"] {
          background-color: var(--primary-color);
        }
        
        .chart-bar[data-type="T-Cell"] {
          background-color: var(--secondary-color);
        }
        
        .chart-bar[data-type="MHC-I"] {
          background-color: var(--accent-color);
        }
        
        .chart-bar[data-type="MHC-II"] {
          background-color: var(--gray-500);
        }
        
        .chart-labels {
          display: flex;
          justify-content: space-around;
          width: 100%;
        }
        
        .chart-label {
          width: 60px;
          text-align: center;
          font-size: 12px;
          color: var(--gray-700);
        }
      `;
      
      document.head.appendChild(style);
      
      // Add animation effect
      setTimeout(() => {
        const bars = document.querySelectorAll('.chart-bar');
        bars.forEach(bar => {
          const originalHeight = bar.style.height;
          bar.style.height = '0';
          setTimeout(() => {
            bar.style.height = originalHeight;
          }, 100);
        });
      }, 100);
    }
    
    // Set up metric icons
    setupMetricIcons();
  }
  
  /**
   * Set up metric icons in the final results
   */
  function setupMetricIcons() {
    // Add icons to metrics
    const epitopeIcon = document.getElementById('epitopeIcon');
    const coverageIcon = document.getElementById('coverageIcon');
    const antigenicityIcon = document.getElementById('antigenicityIcon');
    const safetyIcon = document.getElementById('safetyIcon');
    
    if (epitopeIcon) {
      epitopeIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--primary-color);">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      `;
    }
    
    if (coverageIcon) {
      coverageIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--primary-color);">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      `;
    }
    
    if (antigenicityIcon) {
      antigenicityIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--primary-color);">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      `;
    }
    
    if (safetyIcon) {
      safetyIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--primary-color);">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      `;
    }
  }
  
  /**
   * Get a random number between min and max
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random number between min and max
   */
  function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
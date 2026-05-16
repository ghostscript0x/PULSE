/**
 * PULSE Frontend Intelligence
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('[INIT] Frontend effects active');

    // Add glowing hover effects to glass panels
    const panels = document.querySelectorAll('.glass-panel');
    panels.forEach(panel => {
        panel.addEventListener('mousemove', (e) => {
            const rect = panel.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            panel.style.setProperty('--mouse-x', `${x}px`);
            panel.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // Handle Heatmap interactivity if needed
    const heatmapCells = document.querySelectorAll('#heatmap div div');
    heatmapCells.forEach(cell => {
        cell.addEventListener('mouseover', () => {
            cell.style.transform = 'scale(1.2)';
            cell.style.zIndex = '10';
        });
        cell.addEventListener('mouseout', () => {
            cell.style.transform = 'scale(1)';
            cell.style.zIndex = '1';
        });
    });
});

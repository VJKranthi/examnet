// ================================
// STUDY MATERIALS PAGE SCRIPT
// ================================

// Enable click behavior on Year Cards
document.addEventListener("DOMContentLoaded", () => {
    
    const yearCards = document.querySelectorAll(".year-card");

    yearCards.forEach((card, index) => {
        card.addEventListener("click", () => {
            
            // Redirect based on selected year
            if (index === 0) {
                // 1st Year
                window.location.href = "subjects-1st-year.html";
            } else {
                // 2nd Year
                window.location.href = "subjects-2nd-year.html";
            }
        });
    });

});

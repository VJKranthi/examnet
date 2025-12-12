function openSubject(year, subject) {
    // Example: redirect → pdf-list.html?year=1st&subject=physics
    window.location.href = `pdf-list.html?year=${year}&subject=${subject}`;
}

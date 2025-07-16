const buttons = document.querySelectorAll(".nav-button");

buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    // Remove 'active' from all buttons
    buttons.forEach((b) => b.classList.remove("active"));
    // Add 'active' to the clicked button
    btn.classList.add("active");
  });
});

const textarea = document.querySelector(".box textarea");
textarea.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
});

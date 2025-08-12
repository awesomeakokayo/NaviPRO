document.addEventListener('DOMContentLoaded', function() {
    // Get all necessary elements
    const steps = document.querySelectorAll('.step');
    const nextButtons = document.querySelectorAll('.next-btn');
    const backButtons = document.querySelectorAll('.back-btn');
    const progressBar = document.getElementById('progress-bar-fill');
    const optionButtons = document.querySelectorAll('.option-btn');
    const selectButtons = document.querySelectorAll('.select-btn');
    const targetRoleInput = document.querySelector('#target-role');


    // Initialize first step
    let currentStep = 1;
    steps[0].classList.add('active');
    updateProgressBar();

    // Handle option button clicks (Step 1)
    optionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const parentStep = this.closest('.step');
            parentStep.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            enableNextButton(currentStep - 1);
        });
    });

    // Handle select button clicks 
    selectButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const parentStep = this.closest('.step');
            parentStep.querySelectorAll('.select-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            this.classList.add('selected');
            enableNextButton(currentStep - 1);
        });
    });

    // Handle input field (Step 2)
    if (targetRoleInput) {
        targetRoleInput.addEventListener('input', function() {
            const nextBtn = steps[1].querySelector('.next-btn');
            if (this.value.trim() !== '') {
                enableNextButton(1);
            } else {
                disableNextButton(1);
            }
        });
    }

    // Handle next button clicks
    nextButtons.forEach((button, index) => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentStep < steps.length) {
                steps[currentStep - 1].classList.remove('active');
                steps[currentStep].classList.add('active');
                currentStep++;
                updateProgressBar();
            }
        });
    });

    // Handle back button clicks
    backButtons.forEach((button, index) => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentStep > 1) {
                steps[currentStep - 1].classList.remove('active');
                steps[currentStep - 2].classList.add('active');
                currentStep--;
                updateProgressBar();
            }
        });
    });

    // Helper functions
    function updateProgressBar() {
        const progress = ((currentStep - 1) / (steps.length - 1)) * 100;
        progressBar.style.width = `${progress}%`;
    }

    function enableNextButton(stepIndex) {
        const nextBtn = steps[stepIndex].querySelector('.next-btn');
        if (nextBtn) {
            nextBtn.removeAttribute('disabled');
            nextBtn.style.background = '#FF9E00';
        }
    }

    function disableNextButton(stepIndex) {
        const nextBtn = steps[stepIndex].querySelector('.next-btn');
        if (nextBtn) {
            nextBtn.setAttribute('disabled', '');
            nextBtn.style.background = '#B9B9B9';
        }
    }
});
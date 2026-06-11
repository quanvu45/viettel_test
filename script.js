document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const setupScreen = document.getElementById('setup-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultScreen = document.getElementById('result-screen');

    const startBtn = document.getElementById('start-btn');
    const fileInput = document.getElementById('file-input');
    const errorMsg = document.getElementById('error-msg');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const restartBtn = document.getElementById('restart-btn');

    const questionCounter = document.getElementById('question-counter');
    const categoryBadge = document.getElementById('category-badge');
    const subCategoryBadge = document.getElementById('sub-category-badge');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const progressBar = document.getElementById('progress-bar');

    const scoreDisplay = document.getElementById('score');
    const totalDisplay = document.getElementById('total-questions');
    const finalScoreDisplay = document.getElementById('final-score');
    const finalTotalDisplay = document.getElementById('final-total');
    const feedbackMsg = document.getElementById('feedback-msg');

    // State
    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let hasAnsweredCurrent = false;
    let userAnswers = [];

    // Shuffle array utility
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Initialize Quiz
    startBtn.addEventListener('click', () => {
        fetch('index.json')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                startQuiz(data);
            })
            .catch(error => {
                console.error('Error fetching questions:', error);
                errorMsg.classList.remove('hidden');
            });
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const data = JSON.parse(e.target.result);
                    startQuiz(data);
                } catch (err) {
                    errorMsg.textContent = "Lỗi khi đọc file. Vui lòng đảm bảo đây là file JSON hợp lệ.";
                    errorMsg.classList.remove('hidden');
                }
            };
            reader.readAsText(file);
        }
    });

    function startQuiz(data) {
        if (!data || data.length === 0) {
            errorMsg.textContent = "Bộ câu hỏi trống.";
            errorMsg.classList.remove('hidden');
            return;
        }

        // Shuffle questions for variety
        questions = shuffleArray([...data]);
        currentQuestionIndex = 0;
        score = 0;
        userAnswers = new Array(questions.length).fill(null);

        totalDisplay.textContent = questions.length;
        scoreDisplay.textContent = score;

        switchScreen(setupScreen, quizScreen);
        loadQuestion();
    }

    function loadQuestion() {
        hasAnsweredCurrent = false;
        nextBtn.classList.add('hidden');

        if (currentQuestionIndex > 0) {
            prevBtn.classList.remove('hidden');
        } else {
            prevBtn.classList.add('hidden');
        }

        const q = questions[currentQuestionIndex];

        // Update UI
        questionCounter.textContent = `Câu ${currentQuestionIndex + 1}/${questions.length}`;
        categoryBadge.textContent = q.category || 'Chung';

        if (q.sub_category) {
            subCategoryBadge.textContent = q.sub_category;
            subCategoryBadge.style.display = 'inline-block';
        } else {
            subCategoryBadge.style.display = 'none';
        }

        // Format text (preserve line breaks)
        questionText.innerHTML = q.question.replace(/\n/g, '<br>');

        // Update Progress
        const progress = ((currentQuestionIndex) / questions.length) * 100;
        progressBar.style.width = `${progress}%`;

        // Load Options
        optionsContainer.innerHTML = '';

        // We shouldn't shuffle options because correctIndex depends on the original order.
        const optionsList = q.choices || q.options;
        const correctIdx = (q.answer !== undefined) ? q.answer - 1 : q.correctIndex;

        optionsList.forEach((optionText, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';

            // Format option text
            btn.innerHTML = optionText.replace(/\n/g, '<br>');

            btn.addEventListener('click', () => checkAnswer(index, btn, correctIdx));
            optionsContainer.appendChild(btn);
        });

        // Check if previously answered
        const previousAnswer = userAnswers[currentQuestionIndex];
        if (previousAnswer) {
            hasAnsweredCurrent = true;
            const allOptions = optionsContainer.children;
            for (let btn of allOptions) {
                btn.disabled = true;
            }
            if (previousAnswer.isCorrect) {
                allOptions[previousAnswer.selectedIndex].classList.add('correct');
            } else {
                allOptions[previousAnswer.selectedIndex].classList.add('wrong');
                allOptions[correctIdx].classList.add('correct');
            }
            nextBtn.classList.remove('hidden');
            if (currentQuestionIndex === questions.length - 1) {
                nextBtn.textContent = 'Xem kết quả';
            } else {
                nextBtn.textContent = 'Câu tiếp theo ➔';
            }
        }
    }

    function checkAnswer(selectedIndex, btnElement, correctIndex) {
        if (hasAnsweredCurrent) return;
        hasAnsweredCurrent = true;

        const isCorrect = selectedIndex === correctIndex;
        const allOptions = optionsContainer.children;

        // Disable all buttons
        for (let btn of allOptions) {
            btn.disabled = true;
        }

        if (isCorrect) {
            btnElement.classList.add('correct');
            score++;
            scoreDisplay.textContent = score;
        } else {
            btnElement.classList.add('wrong');
            // Highlight correct answer
            allOptions[correctIndex].classList.add('correct');
        }

        userAnswers[currentQuestionIndex] = { selectedIndex, isCorrect };

        // Update progress bar to include current question
        const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
        progressBar.style.width = `${progress}%`;

        // Show next button
        nextBtn.classList.remove('hidden');

        if (currentQuestionIndex === questions.length - 1) {
            nextBtn.textContent = 'Xem kết quả';
        } else {
            nextBtn.textContent = 'Câu tiếp theo ➔';
        }
    }

    nextBtn.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            loadQuestion();
        } else {
            showResults();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            loadQuestion();
        }
    });

    function showResults() {
        switchScreen(quizScreen, resultScreen);

        finalScoreDisplay.textContent = score;
        finalTotalDisplay.textContent = questions.length;

        const percentage = (score / questions.length) * 100;
        if (percentage >= 90) {
            feedbackMsg.textContent = "Xuất sắc! Bạn nắm bài rất vững.";
        } else if (percentage >= 70) {
            feedbackMsg.textContent = "Khá lắm! Bạn đã làm rất tốt.";
        } else if (percentage >= 50) {
            feedbackMsg.textContent = "Đạt! Nhưng bạn có thể làm tốt hơn nữa.";
        } else {
            feedbackMsg.textContent = "Cần cố gắng hơn. Hãy ôn tập lại nhé!";
        }
    }

    restartBtn.addEventListener('click', () => {
        // Reset and go back to setup or reload current questions
        questions = shuffleArray([...questions]);
        currentQuestionIndex = 0;
        score = 0;
        userAnswers = new Array(questions.length).fill(null);
        scoreDisplay.textContent = score;
        switchScreen(resultScreen, quizScreen);
        loadQuestion();
    });

    function switchScreen(hideScreen, showScreen) {
        hideScreen.classList.remove('active');
        setTimeout(() => {
            hideScreen.classList.add('hidden');
            showScreen.classList.remove('hidden');
            // Slight delay for reflow before animation
            setTimeout(() => {
                showScreen.classList.add('active');
            }, 10);
        }, 300); // Wait for fade out
    }
});

const generateBtn = document.getElementById('generate-btn');
const ballContainer = document.getElementById('ball-container');

function generateLottoNumbers() {
    const numbers = [];
    while (numbers.length < 6) {
        const num = Math.floor(Math.random() * 45) + 1;
        if (!numbers.includes(num)) {
            numbers.push(num);
        }
    }
    // 오름차순 정렬
    return numbers.sort((a, b) => a - b);
}

function getBallColorClass(num) {
    if (num <= 10) return 'color-1';
    if (num <= 20) return 'color-2';
    if (num <= 30) return 'color-3';
    if (num <= 40) return 'color-4';
    return 'color-5';
}

function createBall(num, delay) {
    const ball = document.createElement('div');
    ball.classList.add('ball', getBallColorClass(num));
    ball.textContent = num;
    ball.style.animationDelay = `${delay}s`;
    return ball;
}

generateBtn.addEventListener('click', () => {
    // 기존 내용 삭제
    ballContainer.innerHTML = '';
    
    const lottoNumbers = generateLottoNumbers();
    
    // 번호 공 생성 및 추가 (애니메이션 시차 적용)
    lottoNumbers.forEach((num, index) => {
        const ball = createBall(num, index * 0.1);
        ballContainer.appendChild(ball);
    });
    
    // 버튼 텍스트 변경
    generateBtn.textContent = '다시 생성하기';
});

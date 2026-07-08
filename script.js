(() => {
  const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  const gameModeSelect = document.getElementById('gameMode');
  const difficultySelect = document.getElementById('difficulty');
  const symbolSelect = document.getElementById('playerSymbol');
  const statusEl = document.getElementById('status');
  const boardEl = document.getElementById('board');
  const cells = Array.from(document.querySelectorAll('.cell'));
  const restartBtn = document.getElementById('restartBtn');
  const newGameBtn = document.getElementById('newGameBtn');
  const playerScoreEl = document.getElementById('playerScore');
  const computerScoreEl = document.getElementById('computerScore');
  const drawScoreEl = document.getElementById('drawScore');
  const playerLabel = document.getElementById('playerLabel');
  const computerLabel = document.getElementById('computerLabel');

  let board = Array(9).fill(null);
  let current = 'X';
  let mode = gameModeSelect.value;         // 'computer' | 'twoplayer'
  let difficulty = difficultySelect.value; // 'easy' | 'medium' | 'hard'
  let humanMark = symbolSelect.value;      // 'X' | 'O'
  let aiMark = humanMark === 'X' ? 'O' : 'X';
  let gameOver = false;
  let scores = { X: 0, O: 0, draw: 0 };

  /* ---------------- helpers ---------------- */

  function checkWinner(b) {
    for (const line of WIN_LINES) {
      const [a, c, d] = line;
      if (b[a] && b[a] === b[c] && b[a] === b[d]) return { player: b[a], line };
    }
    if (b.every(v => v)) return { player: 'draw', line: null };
    return null;
  }

  function emptyIndices(b) {
    return b.reduce((acc, v, idx) => { if (!v) acc.push(idx); return acc; }, []);
  }

  function updateLabels() {
    if (mode === 'computer') {
      playerLabel.textContent = `Player (${humanMark})`;
      computerLabel.textContent = `Computer (${aiMark})`;
      playerScoreEl.style.color = humanMark === 'X' ? 'var(--x-color)' : 'var(--o-color)';
      computerScoreEl.style.color = aiMark === 'X' ? 'var(--x-color)' : 'var(--o-color)';
    } else {
      playerLabel.textContent = 'Player 1 (X)';
      computerLabel.textContent = 'Player 2 (O)';
      playerScoreEl.style.color = 'var(--x-color)';
      computerScoreEl.style.color = 'var(--o-color)';
    }
  }

  function updateStatus() {
    statusEl.classList.remove('win', 'draw');
    if (gameOver) return;
    if (mode === 'computer') {
      statusEl.textContent = current === humanMark
        ? `Your Turn (${humanMark})`
        : `Computer Thinking (${aiMark})`;
    } else {
      statusEl.textContent = `Player ${current === 'X' ? '1' : '2'}'s Turn (${current})`;
    }
  }

  function renderCell(i) {
    const cell = cells[i];
    cell.classList.remove('x', 'o');
    if (board[i]) {
      cell.classList.add(board[i].toLowerCase());
      cell.textContent = board[i];
      cell.classList.add('disabled');
    }
  }

  /* ---------------- minimax AI ---------------- */

  function minimax(b, depth, isMax, alpha, beta) {
    const result = checkWinner(b);
    if (result) {
      if (result.player === aiMark) return 10 - depth;
      if (result.player === humanMark) return depth - 10;
      return 0;
    }
    if (isMax) {
      let best = -Infinity;
      for (const i of emptyIndices(b)) {
        b[i] = aiMark;
        best = Math.max(best, minimax(b, depth + 1, false, alpha, beta));
        b[i] = null;
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const i of emptyIndices(b)) {
        b[i] = humanMark;
        best = Math.min(best, minimax(b, depth + 1, true, alpha, beta));
        b[i] = null;
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  function bestMove(b) {
    let best = -Infinity;
    let move = null;
    for (const i of emptyIndices(b)) {
      b[i] = aiMark;
      const score = minimax(b, 0, false, -Infinity, Infinity);
      b[i] = null;
      if (score > best) { best = score; move = i; }
    }
    return move;
  }

  function randomMove(b) {
    const options = emptyIndices(b);
    return options[Math.floor(Math.random() * options.length)];
  }

  function aiMove() {
    if (gameOver) return;
    if (!emptyIndices(board).length) return;

    let choice;
    if (difficulty === 'easy') {
      choice = Math.random() < 0.75 ? randomMove(board) : bestMove(board);
    } else if (difficulty === 'medium') {
      choice = Math.random() < 0.35 ? randomMove(board) : bestMove(board);
    } else {
      choice = bestMove(board);
    }
    playMove(choice, aiMark);
  }

  /* ---------------- core game flow ---------------- */

  function endGame(result) {
    gameOver = true;
    cells.forEach(c => c.classList.add('disabled'));

    if (result.player === 'draw') {
      scores.draw++;
      drawScoreEl.textContent = scores.draw;
      statusEl.textContent = "It's a Draw!";
      statusEl.classList.add('draw');
      return;
    }

    result.line.forEach(i => cells[i].classList.add('win-cell'));
    scores[result.player]++;

    if (mode === 'computer') {
      playerScoreEl.textContent = scores[humanMark];
      computerScoreEl.textContent = scores[aiMark];
    } else {
      playerScoreEl.textContent = scores.X;
      computerScoreEl.textContent = scores.O;
    }

    if (mode === 'computer') {
      const youWon = result.player === humanMark;
      statusEl.textContent = youWon ? 'You Win! 🎉' : 'Computer Wins!';
    } else {
      statusEl.textContent = `Player ${result.player === 'X' ? '1' : '2'} Wins!`;
    }
    statusEl.classList.add('win');
  }

  function playMove(i, mark) {
    if (board[i] || gameOver) return;
    board[i] = mark;
    renderCell(i);

    const result = checkWinner(board);
    if (result) { endGame(result); return; }

    current = mark === 'X' ? 'O' : 'X';
    updateStatus();

    if (mode === 'computer' && current === aiMark && !gameOver) {
      setTimeout(aiMove, 450);
    }
  }

  function onCellClick(e) {
    const i = Number(e.currentTarget.dataset.index);
    if (board[i] || gameOver) return;
    if (mode === 'computer' && current !== humanMark) return;
    playMove(i, current);
  }

  /* ---------------- reset / controls ---------------- */

  function resetBoard(fullReset) {
    board = Array(9).fill(null);
    current = 'X';
    gameOver = false;
    cells.forEach(c => {
      c.classList.remove('x', 'o', 'disabled', 'win-cell');
      c.textContent = '';
    });
    updateStatus();

    if (fullReset) {
      scores = { X: 0, O: 0, draw: 0 };
      playerScoreEl.textContent = 0;
      computerScoreEl.textContent = 0;
      drawScoreEl.textContent = 0;
    }

    if (mode === 'computer' && current === aiMark) {
      setTimeout(aiMove, 450);
    }
  }

  cells.forEach(cell => cell.addEventListener('click', onCellClick));

  restartBtn.addEventListener('click', () => resetBoard(false));
  newGameBtn.addEventListener('click', () => resetBoard(true));

  gameModeSelect.addEventListener('change', () => {
    mode = gameModeSelect.value;
    symbolSelect.parentElement.style.display = mode === 'computer' ? '' : 'none';
    difficultySelect.parentElement.style.display = mode === 'computer' ? '' : 'none';
    updateLabels();
    resetBoard(true);
  });

  difficultySelect.addEventListener('change', () => {
    difficulty = difficultySelect.value;
    resetBoard(true);
  });

  symbolSelect.addEventListener('change', () => {
    humanMark = symbolSelect.value;
    aiMark = humanMark === 'X' ? 'O' : 'X';
    updateLabels();
    resetBoard(true);
  });

  updateLabels();
  updateStatus();
})();

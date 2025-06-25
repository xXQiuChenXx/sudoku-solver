document.addEventListener("DOMContentLoaded", () => {
  const gridContainer = document.getElementById("sudoku-grid");
  const solveButton = document.getElementById("solve-button");
  const clearButton = document.getElementById("clear-button");
  const sampleButton = document.getElementById("sample-button");
  const statusDiv = document.getElementById("status");
  const stepsContainer = document.getElementById("steps-container");
  const speedSlider = document.getElementById("speed-slider");

  let animationSpeed = 50;
  let isSolving = false;

  // --- Grid Creation ---
  const cells = [];
  for (let i = 0; i < 9; i++) {
    const row = document.createElement("div");
    row.className = "row";
    row.style.display = "contents"; // Important for grid layout
    for (let j = 0; j < 9; j++) {
      const cellDiv = document.createElement("div");
      cellDiv.className = "sudoku-cell";
      const input = document.createElement("input");
      input.type = "text";
      input.maxLength = 1;
      input.dataset.row = i;
      input.dataset.col = j;
      input.addEventListener("input", (e) => {
        // Allow only numbers 1-9
        e.target.value = e.target.value.replace(/[^1-9]/g, "");
      });
      cellDiv.appendChild(input);
      row.appendChild(cellDiv);
      cells.push(input);
    }
    gridContainer.appendChild(row);
  }

  // --- Utility Functions ---

  // Reads the grid from the UI into a 2D array
  function getBoard() {
    const board = Array(9)
      .fill(0)
      .map(() => Array(9).fill(0));
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        const value = cells[i * 9 + j].value;
        board[i][j] = value ? parseInt(value) : 0;
      }
    }
    return board;
  }

  // Sets the UI grid from a 2D array
  function setBoard(board, isInitial = false) {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        const cell = cells[i * 9 + j];
        if (board[i][j] !== 0) {
          cell.value = board[i][j];
          if (isInitial) {
            cell.readOnly = true;
            cell.parentElement.classList.add("initial-value");
          }
        } else {
          cell.value = "";
        }
      }
    }
  }

  // Checks if the initial board state is valid
  function validateBoard(board) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] !== 0) {
          const num = board[r][c];
          board[r][c] = 0; // Temporarily remove to check against itself
          if (!isValid(board, r, c, num)) {
            board[r][c] = num; // Restore
            return false;
          }
          board[r][c] = num; // Restore
        }
      }
    }
    return true;
  }

  // --- Core Solving Logic (Backtracking Algorithm) ---

  const steps = [];

  // Checks if placing a number is valid
  function isValid(board, row, col, num) {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (board[row][x] === num) return false;
    }
    // Check column
    for (let x = 0; x < 9; x++) {
      if (board[x][col] === num) return false;
    }
    // Check 3x3 subgrid
    const startRow = row - (row % 3);
    const startCol = col - (col % 3);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i + startRow][j + startCol] === num) return false;
      }
    }
    return true;
  }

  // Main recursive solver
  function solveSudoku(board) {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(board, i, j, num)) {
              board[i][j] = num;
              steps.push({ row: i, col: j, num: num, type: "place" });
              if (solveSudoku(board)) {
                return true;
              } else {
                board[i][j] = 0;
                steps.push({ row: i, col: j, num: 0, type: "backtrack" });
              }
            }
          }
          return false; // Backtrack
        }
      }
    }
    return true; // Solved
  }

  // --- UI Interaction and Visualization ---

  function clearBoard() {
    isSolving = false;
    cells.forEach((cell) => {
      cell.value = "";
      cell.readOnly = false;
      cell.parentElement.classList.remove("initial-value", "solving-step");
    });
    statusDiv.textContent = "";
    stepsContainer.innerHTML = "Steps will appear here...";
  }

  async function visualizeSteps() {
    stepsContainer.innerHTML = ""; // Clear previous steps
    isSolving = true;
    const board = getBoard();

    for (const step of steps) {
      if (!isSolving) return; // Stop if user clears

      const { row, col, num, type } = step;
      const cell = cells[row * 9 + col];

      await new Promise((resolve) => setTimeout(resolve, animationSpeed));

      board[row][col] = num;
      cell.value = num === 0 ? "" : num;

      const stepElement = document.createElement("div");
      stepElement.className = `p-1 rounded ${
        type === "place" ? "text-green-700" : "text-red-700"
      }`;
      stepElement.textContent = `${
        type === "place" ? "Placing" : "Backtrack"
      }: ${num} at (${row + 1}, ${col + 1})`;
      stepsContainer.appendChild(stepElement);
      stepsContainer.scrollTop = stepsContainer.scrollHeight;

      // Visual feedback on the grid
      cell.parentElement.classList.add("solving-step");
      setTimeout(
        () => cell.parentElement.classList.remove("solving-step"),
        500
      );
    }
    isSolving = false;
  }

  solveButton.addEventListener("click", () => {
    if (isSolving) return;

    // Clear previous state but keep numbers
    steps.length = 0;
    stepsContainer.innerHTML = "Solving...";
    statusDiv.textContent = "Solving...";

    const board = getBoard();

    // Mark initial numbers
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        const cell = cells[i * 9 + j];
        cell.parentElement.classList.remove("initial-value");
        cell.readOnly = false;
        if (board[i][j] !== 0) {
          cell.readOnly = true;
          cell.parentElement.classList.add("initial-value");
        }
      }
    }

    if (!validateBoard(getBoard())) {
      statusDiv.textContent =
        "Invalid puzzle: A number is repeated in a row, column, or box.";
      stepsContainer.innerHTML = "Cannot solve.";
      return;
    }

    const boardCopy = getBoard().map((row) => [...row]);

    if (solveSudoku(boardCopy)) {
      statusDiv.textContent = "Solved!";
      visualizeSteps();
    } else {
      statusDiv.textContent = "This puzzle is unsolvable.";
      stepsContainer.innerHTML = "No solution found.";
    }
  });

  clearButton.addEventListener("click", clearBoard);

  sampleButton.addEventListener("click", () => {
    clearBoard();
    const sampleBoard = [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ];
    setBoard(sampleBoard, true);
  });

  speedSlider.addEventListener("input", (e) => {
    // Invert the value so left is slow and right is fast
    animationSpeed = 510 - e.target.value;
  });
});

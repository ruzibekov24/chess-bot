const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const resetBtn = document.getElementById("reset");

let board = [];
let currentPlayer = "white";
let selected = null;
let gameOver = false;

// Rasm figuralari
const pieces = {
    white: {
        king: '<img src="https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg" alt="K">',
        queen: '<img src="https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg" alt="Q">',
        rook: '<img src="https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg" alt="R">',
        bishop: '<img src="https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg" alt="B">',
        knight: '<img src="https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg" alt="N">',
        pawn: '<img src="https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg" alt="P">'
    },
    black: {
        king: '<img src="https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg" alt="k">',
        queen: '<img src="https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg" alt="q">',
        rook: '<img src="https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg" alt="r">',
        bishop: '<img src="https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg" alt="b">',
        knight: '<img src="https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg" alt="n">',
        pawn: '<img src="https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg" alt="p">'
    }
};

// Helperlar
function getPieceColor(piece) {
    if (!piece) return null;
    for (let color of ["white", "black"]) {
        for (let key in pieces[color]) {
            if (pieces[color][key] === piece) return color;
        }
    }
    return null;
}
function getPieceType(piece) {
    if (!piece) return null;
    for (let color of ["white", "black"]) {
        for (let key in pieces[color]) {
            if (pieces[color][key] === piece) return key;
        }
    }
    return null;
}

// Taxtani boshlash
function initBoard() {
    gameOver = false;
    currentPlayer = "white";
    statusEl.textContent = `O‘yinchi: Oq navbat`;
    board = [];
    boardEl.innerHTML = "";

    for (let i = 0; i < 8; i++) {
        board[i] = [];
        for (let j = 0; j < 8; j++) {
            const square = document.createElement("div");
            square.classList.add("square");
            square.classList.add((i + j) % 2 === 0 ? "white" : "black");
            square.dataset.row = i;
            square.dataset.col = j;
            square.addEventListener("click", onSquareClick);
            boardEl.appendChild(square);
            board[i][j] = null;
        }
    }

    // Qora orqa qator
    board[0][0] = pieces.black.rook;
    board[0][1] = pieces.black.knight;
    board[0][2] = pieces.black.bishop;
    board[0][3] = pieces.black.queen;
    board[0][4] = pieces.black.king;
    board[0][5] = pieces.black.bishop;
    board[0][6] = pieces.black.knight;
    board[0][7] = pieces.black.rook;

    // Qora piyodalar
    for (let i = 0; i < 8; i++) board[1][i] = pieces.black.pawn;

    // Oq piyodalar
    for (let i = 0; i < 8; i++) board[6][i] = pieces.white.pawn;

    // Oq orqa qator
    board[7][0] = pieces.white.rook;
    board[7][1] = pieces.white.knight;
    board[7][2] = pieces.white.bishop;
    board[7][3] = pieces.white.queen;
    board[7][4] = pieces.white.king;
    board[7][5] = pieces.white.bishop;
    board[7][6] = pieces.white.knight;
    board[7][7] = pieces.white.rook;

    renderBoard();
}

// Chizish
function renderBoard() {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const square = boardEl.querySelector(`[data-row='${i}'][data-col='${j}']`);
            square.innerHTML = board[i][j] || "";
            square.classList.remove("selected");
        }
    }
}

// King ni topish
function findKing(color) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && getPieceColor(p) === color && getPieceType(p) === "king") return { r, c };
        }
    }
    return null;
}

// To'g'ridan-to'g'ri hujum (attacked)ni tekshirish
function isSquareAttacked(byColor, targetRow, targetCol) {
    // har bir byColor figuralarini tekshiramiz
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (!p) continue;
            const color = getPieceColor(p);
            if (color !== byColor) continue;
            const type = getPieceType(p);
            const rd = targetRow - r;
            const cd = targetCol - c;

            if (type === "pawn") {
                let dir = (byColor === "white") ? -1 : 1; // pawn attacks diagonally forward from its perspective
                if (rd === dir && Math.abs(cd) === 1) return true;
            } else if (type === "knight") {
                if ((Math.abs(rd) === 2 && Math.abs(cd) === 1) || (Math.abs(rd) === 1 && Math.abs(cd) === 2)) return true;
            } else if (type === "king") {
                if (Math.abs(rd) <= 1 && Math.abs(cd) <= 1) return true;
            } else if (type === "rook") {
                if (rd === 0 || cd === 0) {
                    let rStep = rd === 0 ? 0 : (rd > 0 ? 1 : -1);
                    let cStep = cd === 0 ? 0 : (cd > 0 ? 1 : -1);
                    let rr = r + rStep, cc = c + cStep;
                    let blocked = false;
                    while (rr !== targetRow || cc !== targetCol) {
                        if (board[rr][cc]) { blocked = true; break; }
                        rr += rStep; cc += cStep;
                    }
                    if (!blocked) return true;
                }
            } else if (type === "bishop") {
                if (Math.abs(rd) === Math.abs(cd)) {
                    let rStep = rd > 0 ? 1 : -1;
                    let cStep = cd > 0 ? 1 : -1;
                    let rr = r + rStep, cc = c + cStep;
                    let blocked = false;
                    while (rr !== targetRow || cc !== targetCol) {
                        if (board[rr][cc]) { blocked = true; break; }
                        rr += rStep; cc += cStep;
                    }
                    if (!blocked) return true;
                }
            } else if (type === "queen") {
                if (rd === 0 || cd === 0) {
                    let rStep = rd === 0 ? 0 : (rd > 0 ? 1 : -1);
                    let cStep = cd === 0 ? 0 : (cd > 0 ? 1 : -1);
                    let rr = r + rStep, cc = c + cStep;
                    let blocked = false;
                    while (rr !== targetRow || cc !== targetCol) {
                        if (board[rr][cc]) { blocked = true; break; }
                        rr += rStep; cc += cStep;
                    }
                    if (!blocked) return true;
                }
                if (Math.abs(rd) === Math.abs(cd)) {
                    let rStep = rd > 0 ? 1 : -1;
                    let cStep = cd > 0 ? 1 : -1;
                    let rr = r + rStep, cc = c + cStep;
                    let blocked = false;
                    while (rr !== targetRow || cc !== targetCol) {
                        if (board[rr][cc]) { blocked = true; break; }
                        rr += rStep; cc += cStep;
                    }
                    if (!blocked) return true;
                }
            }
        }
    }
    return false;
}

// Bir rangning kingi shaxda ekanligini tekshirish
function isInCheck(color) {
    const king = findKing(color);
    if (!king) return false;
    const enemy = color === "white" ? "black" : "white";
    return isSquareAttacked(enemy, king.r, king.c);
}

// Simulatsiya qilib, move qilgandan keyin king shaxda qolmasligini tekshirish
function moveLeavesKingSafe(fromR, fromC, toR, toC) {
    const savedFrom = board[fromR][fromC];
    const savedTo = board[toR][toC];
    board[toR][toC] = savedFrom;
    board[fromR][fromC] = null;
    const color = getPieceColor(savedFrom);
    const safe = !isInCheck(color);
    // undo
    board[fromR][fromC] = savedFrom;
    board[toR][toC] = savedTo;
    return safe;
}

// Harakat qoidalari (harakat qonuniy va keyin king xavfsiz bo'lishi)
function isLegalMovement(piece, fromRow, fromCol, toRow, toCol) {
    if (!piece) return false;
    const type = getPieceType(piece);
    const color = getPieceColor(piece);
    const target = board[toRow][toCol];
    const targetColor = target ? getPieceColor(target) : null;
    if (color !== currentPlayer) return false;
    if (targetColor === color) return false;

    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;

    // movement check (without king-capture restriction here)
    switch(type) {
        case "pawn": {
            let dir = color === "white" ? -1 : 1;
            // forward
            if (colDiff === 0 && rowDiff === dir && !target) return moveLeavesKingSafe(fromRow, fromCol, toRow, toCol);
            // double
            if (colDiff === 0 && rowDiff === 2*dir && !target && ((color==="white" && fromRow===6)||(color==="black" && fromRow===1)) && !board[fromRow+dir][fromCol]) return moveLeavesKingSafe(fromRow, fromCol, toRow, toCol);
            // capture
            if (Math.abs(colDiff)===1 && rowDiff===dir && target && getPieceColor(target)!==color) return moveLeavesKingSafe(fromRow, fromCol, toRow, toCol);
            return false;
        }
        case "rook": {
            if (!(rowDiff===0 || colDiff===0)) return false;
            let rStep = rowDiff===0?0:(rowDiff>0?1:-1);
            let cStep = colDiff===0?0:(colDiff>0?1:-1);
            let rr = fromRow + rStep, cc = fromCol + cStep;
            while(rr !== toRow || cc !== toCol) {
                if (board[rr][cc]) return false;
                rr += rStep; cc += cStep;
            }
            return moveLeavesKingSafe(fromRow, fromCol, toRow, toCol);
        }
        case "bishop": {
            if (Math.abs(rowDiff) !== Math.abs(colDiff)) return false;
            let rStep = rowDiff>0?1:-1;
            let cStep = colDiff>0?1:-1;
            let rr = fromRow + rStep, cc = fromCol + cStep;
            while(rr !== toRow || cc !== toCol) {
                if (board[rr][cc]) return false;
                rr += rStep; cc += cStep;
            }
            return moveLeavesKingSafe(fromRow, fromCol, toRow, toCol);
        }
        case "queen": {
            // rook-like
            if (rowDiff===0 || colDiff===0) {
                let rStep = rowDiff===0?0:(rowDiff>0?1:-1);
                let cStep = colDiff===0?0:(colDiff>0?1:-1);
                let rr = fromRow + rStep, cc = fromCol + cStep;
                while(rr !== toRow || cc !== toCol) {
                    if (board[rr][cc]) return false;
                    rr += rStep; cc += cStep;
                }
                return moveLeavesKingSafe(fromRow, fromCol, toRow, toCol);
            }
            // bishop-like
            if (Math.abs(rowDiff)===Math.abs(colDiff)) {
                let rStep = rowDiff>0?1:-1;
                let cStep = colDiff>0?1:-1;
                let rr = fromRow + rStep, cc = fromCol + cStep;
                while(rr !== toRow || cc !== toCol) {
                    if (board[rr][cc]) return false;
                    rr += rStep; cc += cStep;
                }
                return moveLeavesKingSafe(fromRow, fromCol, toRow, toCol);
            }
            return false;
        }
        case "king": {
            if (Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1) {
                // king cannot move into an attacked square
                // simulate and check
                if (!moveLeavesKingSafe(fromRow, fromCol, toRow, toCol)) return false;
                // plus ensure target square not attacked by enemy
                const enemy = color === "white" ? "black" : "white";
                if (isSquareAttacked(enemy, toRow, toCol)) return false;
                return true;
            }
            return false;
        }
        case "knight": {
            if ((Math.abs(rowDiff)===2 && Math.abs(colDiff)===1) || (Math.abs(rowDiff)===1 && Math.abs(colDiff)===2)) {
                return moveLeavesKingSafe(fromRow, fromCol, toRow, toCol);
            }
            return false;
        }
        default: return false;
    }
}

// O‘yinchi hozir shaxda bo‘lsa, faqat shaxni yenguvchi moves ruxsat etilsin:
// - kingni ko‘chirish (shaxdan chiqish)
// - shaxni berayotgan figarani urish (capture)
// - chiziqli hujum bo‘lsa - bloklash
// Buning uchun har bir mumkin bo‘lgan move simulatsiya qilinib tekshiriladi.

function playerHasAnyLegalMove(color) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (!p || getPieceColor(p) !== color) continue;
            // har bir mumkin bo'lgan katakka urinish
            for (let tr = 0; tr < 8; tr++) {
                for (let tc = 0; tc < 8; tc++) {
                    if (isLegalMovement(p, r, c, tr, tc)) return true;
                }
            }
        }
    }
    return false;
}

// Ma'lum bir figura shaxni yechadigan harakatga ega ekanligini tekshirish
function pieceHasMoveThatResolvesCheck(fromR, fromC) {
    const p = board[fromR][fromC];
    if (!p) return false;
    const color = getPieceColor(p);
    // Agar o'yinchi hozir shaxda bo'lsa, shu figuradan barcha harakatlarni sinab ko'ramiz
    for (let tr = 0; tr < 8; tr++) {
        for (let tc = 0; tc < 8; tc++) {
            if (isLegalMovement(p, fromR, fromC, tr, tc)) {
                // simulatsiya qilganda o'z kingi shaxda qolmaydimi?
                // isLegalMovement allaqachon moveLeavesKingSafe ni tekshiradi, shuning uchun true bo'lsa mavhum yechim bo'ladi
                return true;
            }
        }
    }
    return false;
}

// Katak bosish
function onSquareClick(e) {
    if (gameOver) return;
    const row = parseInt(e.currentTarget.dataset.row);
    const col = parseInt(e.currentTarget.dataset.col);

    // agar navbatdagi o'yinchi shaxda bo'lsa, faqat shaxni yechuvchi figuralar tanlanadi
    const inCheck = isInCheck(currentPlayer);

    if (selected) {
        const piece = board[selected.row][selected.col];
        const target = board[row][col];
        if (!piece) {
            selected = null; renderBoard(); return;
        }
        if (isLegalMovement(piece, selected.row, selected.col, row, col)) {
            // amalga oshirish
            // agar kiruvchi target king bo'lsa, g'alaba
            const targetType = target ? getPieceType(target) : null;
            board[row][col] = piece;
            board[selected.row][selected.col] = null;

            if (targetType === "king") {
                alert(`O‘yin tugadi! ${currentPlayer === "white" ? "Oq" : "Qora"} g‘alaba qildi!`);
                gameOver = true;
                renderBoard();
                return;
            }

            // navbatni o'zgartirish va tekshirish
            currentPlayer = currentPlayer === "white" ? "black" : "white";
            statusEl.textContent = `O‘yinchi: ${currentPlayer === "white" ? "Oq" : "Qora"} navbat`;

            // qarshi o'yinchi shaxda bo'lsa va unga hech qanday legal move yo'q - mate
            if (isInCheck(currentPlayer) && !playerHasAnyLegalMove(currentPlayer)) {
                alert(`Mat! ${currentPlayer === "white" ? "Qora" : "Oq"} g‘alaba qildi!`);
                gameOver = true;
            }
        } else {
            // harakat ruxsat etilmagan
            if (inCheck) {
                alert("Siz shaxdasiz: faqat shaxni olib tashlaydigan harakatlar ruxsat etiladi.");
            } else {
                alert("Noto‘g‘ri harakat.");
            }
        }
        selected = null;
        renderBoard();
        return;
    }

    // hech narsa tanlanmagan - tanlashni tekshiramiz
    if (board[row][col] && getPieceColor(board[row][col]) === currentPlayer) {
        // agar o'yinchi shaxda bo'lsa, faqat shu figura haqiqiy shaxni yenguvchi harakatga ega bo'lsa tanlashga ruxsat berilsin
        if (inCheck) {
            if (!pieceHasMoveThatResolvesCheck(row, col)) {
                alert("Siz shaxdasiz: bu figura shaxni olib tashlay olmaydi.");
                return;
            }
        }
        selected = { row, col };
        e.currentTarget.classList.add("selected");
    } else {
        // agar katakka boshqa rangdagi figura bosilgan bo'lsa - hech narsa qilinmasin
    }
}

resetBtn.addEventListener("click", initBoard);
initBoard();

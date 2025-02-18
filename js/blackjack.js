// TO FIX:
// - player should have option to split
// - player should have option to insurance
// - player should have option to surrender 

const kinds = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'Jack', 'Queen', 'King', 'Ace'];
const suits = ['Diamonds', 'Hearts', 'Spades', 'Clubs'];
const deck = [];

// Making the deck of cards:
kinds.forEach(kind => {
    suits.forEach(suit => {
        deck.push({
            name: `${kind} of ${suit}`,
            file: `${kind}-of-${suit}.png`,
            kind: kind,
            suit: suit,
            valu: kind == 'Ace' ? 11 : kind.length > 3 ? 10 : kind,
        });
    });
});

// Function to shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Randomizing/shuffling the deck:
shuffleArray(deck);

// Making and shuffling a shoe:
const shoe = [...Array(6)].flatMap(() => [...deck]);
shuffleArray(shoe);

// DOM elements
const dealBtn = document.getElementById('deal-btn');
const hitBtn = document.getElementById('hit-btn');
const standBtn = document.getElementById('stand-btn');
const doubleBtn = document.getElementById('double-btn');
const betMenu = document.getElementById('bet-menu');
const moneySpan = document.getElementById('money-span');
const chipsDiv = document.getElementById('chips-div');
const chipsDiv2 = document.getElementById('chips-div-2');
const outH2 = document.querySelector('#out-div h2');
const moneyResultSpan = document.getElementById('money-result-span');
const playerCardsContainer = document.getElementById('player-cards-container');
const splitCardsDiv = document.getElementById('split-cards-div');
const playerCardsDiv = document.getElementById('player-cards-div');
const dealerCardsDiv = document.getElementById('dealer-cards-div');
const playerScoreSpan = document.getElementById('player-score-span');
const dealerScoreSpan = document.getElementById('dealer-score-span');
const insuranceYesBtn = document.createElement('button');
insuranceYesBtn.id = 'insurance-yes-btn';
insuranceYesBtn.textContent = 'Yes';
insuranceYesBtn.style.display = 'none';
const insuranceNoBtn = document.createElement('button');
insuranceNoBtn.id = 'insurance-no-btn';
insuranceNoBtn.textContent = 'No';
insuranceNoBtn.style.display = 'none';
const splitYesBtn = document.createElement('button');
splitYesBtn.id = 'split-yes-btn';
splitYesBtn.textContent = 'Yes';
splitYesBtn.style.display = 'none';
const splitNoBtn = document.createElement('button');
splitNoBtn.id = 'split-no-btn';
splitNoBtn.textContent = 'No';
splitNoBtn.style.display = 'none';
const outDiv = document.getElementById('out-div');
let firstHandScore = 0;
let firstHandBust = false;
let tutPages = document.querySelectorAll('.tutorial-page');
let navBtns = document.querySelectorAll('.nav-btn');
let prevBtn = document.getElementById('prev-btn');
let nextBtn = document.getElementById('next-btn');
const tutorialBtn = document.getElementById('tutorial-btn');
const tutorialDiv = document.getElementById('tutorial-div');

navBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        // Hide all pages
        tutPages.forEach(page => page.classList.remove('active'));
        navBtns.forEach(btn => btn.classList.remove('selected-nav'));
        // Show the selected page
        tutPages[index].classList.add('active');
        // Update active state of nav buttons
        btn.classList.add('selected-nav');
    });
});

prevBtn.addEventListener('click', () => {
    let currentIndex = Array.from(tutPages).findIndex(page => page.classList.contains('active'));
    if (currentIndex > 0) {
        tutPages[currentIndex].classList.remove('active');
        navBtns[currentIndex].classList.remove('selected-nav');
        tutPages[currentIndex - 1].classList.add('active');
        navBtns[currentIndex - 1].classList.add('selected-nav');
    }
});

nextBtn.addEventListener('click', () => {
    let currentIndex = Array.from(tutPages).findIndex(page => page.classList.contains('active'));
    if (currentIndex < tutPages.length - 1) {   
        tutPages[currentIndex].classList.remove('active');
        navBtns[currentIndex].classList.remove('selected-nav');
        tutPages[currentIndex + 1].classList.add('active');
        navBtns[currentIndex + 1].classList.add('selected-nav');
    }
});


// Event listeners
dealBtn.addEventListener('click', deal);
hitBtn.addEventListener('click', hit);
standBtn.addEventListener('click', stand);
doubleBtn.addEventListener('click', doubleDown);
betMenu.addEventListener('change', bet);
insuranceYesBtn.addEventListener('click', offerInsurance);
insuranceNoBtn.addEventListener('click', finishInitialDeal);
splitYesBtn.addEventListener('click', split);
splitNoBtn.addEventListener('click', continueGame);
tutorialBtn.addEventListener('click', toggleTutorial);




// Game state
let money = 5000;
let betAmt = betMenu.value;
let dealCounter;
let playerHand = [];
let splitHand = [];
let dealerHand = [];
let playerScore = 0;
let dealerScore = 0;
let insuranceBet = 0;
let insuranceOffered = false;
let isSplit = false;
let activeHand = playerHand;
let activeCardDiv = playerCardsDiv;
let activeHandCount = 1;

// Update money display
function updateMoneyDisplay() {
    moneySpan.textContent = "$" + money.toLocaleString();
}

updateMoneyDisplay();

function bet() {
    betAmt = +betMenu.value;
    moneyResultSpan.innerHTML = "";
    moneyResultSpan.style.display = "none";
    chipsDiv.innerHTML = "";
    chipsDiv2.innerHTML = "";
    outH2.textContent = "Bet: $" + betAmt.toLocaleString();
    moneyResultSpan.textContent = "Click DEAL to start the game.";
    moneyResultSpan.style.display = "block";
    addBetChips();
    toggleButton(dealBtn, true);
    setTimeout(() => {
        toggleButton(dealBtn, false);
    }, 1000);
}

function evaluateAces(hand, currentScore) {
    let aceCount = hand.filter(card => card.kind === 'Ace').length;
    let score = currentScore;
    while (score > 21 && aceCount > 0) {
        score -= 10;
        aceCount--;
    }
    return score;
}

function checkForSplit() {
    if (playerHand[0].kind == playerHand[1].kind) {
        outDiv.style.display = "block";
        outH2.textContent = "Matching cards. Would you like to split?";
        moneyResultSpan.style.display = "block";
        moneyResultSpan.style.backgroundColor = "transparent";
        moneyResultSpan.appendChild(splitYesBtn);
        moneyResultSpan.appendChild(splitNoBtn);
        splitYesBtn.style.display = 'inline-block';
        splitNoBtn.style.display = 'inline-block';
    } else {
        continueGame();
    }
}

function deal() {
    betAmt = +betMenu.value;
    initializeGame();
    
    let dealInterval = setInterval(() => {
        dealCounter++;
        dealCard(dealCounter % 2 === 1 ? 'player' : 'dealer');
        
        if (dealCounter === 4) {
            clearInterval(dealInterval);
            playerScore = calculateScore(playerHand);
            activeHand = playerHand; // Set activeHand here
            activeCardDiv = playerCardsDiv; // Set activeCardDiv here
            if (playerScore === 21) {
                handlePlayerBlackjack();
            } else {
                checkForInsurance();
            }
        }
    }, 1000);
}


function split() {
        outDiv.style.display = "block";
        outH2.textContent = "You chose to split your hand.";
        moneyResultSpan.innerHTML = "";
        moneyResultSpan.style.display = "none";
        addExtraChips(betAmt);
    isSplit = true;
    splitCardsDiv.style.display = 'block';
    
    // Move the first card to splitHand
    splitCardsDiv.appendChild(playerCardsDiv.children[0]);
    splitHand.push(playerHand[0]);
    playerHand.splice(0, 1);
    activeHand = playerHand;
    activeCardDiv = playerCardsDiv;
    playerScore = calculateScore(activeHand);
    playerScoreSpan.textContent = "Your Score: " + playerScore;

    setTimeout(() => {dealCardToHand(activeHand, activeCardDiv)
    playerScore = calculateScore(activeHand);
    playerScoreSpan.textContent = "Your Score: " + playerScore;}, 2000)

    
    
    setTimeout(() => continueGame(), 3000)  }



function initializeGame() {
    betMenu.disabled = true;
    playerScore = dealerScore = dealCounter = 0;
    playerScoreSpan.textContent = "Your Score: 0";
    dealerScoreSpan.textContent = "Dealer Shows: 0";
    playerCardsDiv.innerHTML = dealerCardsDiv.innerHTML = moneyResultSpan.innerHTML = outH2.innerHTML = chipsDiv2.innerHTML = "";
    playerCardsDiv.style.display = 'block';
    splitCardsDiv.style.display = 'none';
    splitCardsDiv.innerHTML = '';
    outDiv.style.display = "none";
    playerHand = [];
    splitHand = [];
    dealerHand = [];
    firstHandBust = false;
    activeHandCount = 1;
    toggleButton(dealBtn, true);
}

function dealCard(recipient) {
    console.log(dealCounter);
    let card = shoe.pop();
    let pic = new Image();
    pic.src = `images/cards350px/${card.file}`;
    
    if (recipient === 'player') {
        playerCardsDiv.appendChild(pic);
        playerHand.push(card);
        activeHand = playerHand; // Update activeHand here
        playerScore = calculateScore(playerHand);
        playerScoreSpan.textContent = "Your Score: " + playerScore;
    } else {
        pic.style.width = "105px";
        dealerCardsDiv.appendChild(pic);
        dealerHand.push(card);
        dealerScore = calculateScore(dealerHand);
        dealerScoreSpan.textContent = "Dealer Shows: " + dealerHand[0].valu;
        if (dealCounter === 4) {
            pic.src = "images/cards350px/0-Back-of-Card-Red.png";
        }
    }
}
       
function dealCardToHand(hand, cardDiv) {
    let card = shoe.pop();
    let pic = new Image();
    pic.src = `images/cards350px/${card.file}`;
    cardDiv.appendChild(pic);
    hand.push(card);
}

function calculateScore(hand) {
    let score = hand.reduce((sum, card) => sum + card.valu, 0);
    return evaluateAces(hand, score);
}

function checkForInsurance() {
    if (dealerHand[0].kind === 'Ace') {
        insuranceOffered = true;
        outDiv.style.display = "block";
        outH2.textContent = "Dealer shows an Ace. Would you like insurance?";
        moneyResultSpan.style.display = "block";
        moneyResultSpan.style.backgroundColor = "transparent";
        moneyResultSpan.appendChild(insuranceYesBtn);
        moneyResultSpan.appendChild(insuranceNoBtn);
        insuranceYesBtn.style.display = 'inline-block';
        insuranceNoBtn.style.display = 'inline-block';
    } else {
        finishInitialDeal();
    }
}


function offerInsurance() {

    insuranceBet = betAmt / 2;
    updateMoneyDisplay();
    outH2.textContent = `Insurance Bet Placed: $${insuranceBet}`;
    moneyResultSpan.innerHTML = "";
    moneyResultSpan.style.display = "none";
    // Add extra chips for the insurance bet
    addExtraChips(insuranceBet);

    
    setTimeout(() => {
        if (dealerScore === 21) {
            handleDealerBlackjack();
        } else {
            outH2.textContent = "Dealer does not have Blackjack. You lose your insurance bet.";
            chipsDiv2.innerHTML = "";
            money -= insuranceBet;
            updateMoneyDisplay();
            updateMoneyResult(-insuranceBet, "red");
            
            setTimeout(() => {
                finishInitialDeal();
            }, 1500);
        }
    }, 3000);
}

function finishInitialDeal() {
    outH2.textContent = "";
    moneyResultSpan.innerHTML = "";
    outDiv.style.display = "none";
    insuranceOffered = false;
    insuranceBet = 0;
    setTimeout(() => {
        if (playerScore === 21 && dealerScore === 21) {
            handlePush("Both have Blackjack! It's a push.");
        } else if (dealerScore === 21) {
            handleDealerBlackjack();
        } else {
            checkForSplit();
        }
    }, 1500);
}

function handlePush(message) {
    if (isSplit && activeHandCount === 1) {
        activeHandCount++;
        activeHand = splitHand;
        activeCardDiv = splitCardsDiv;
        setTimeout(() => {
            continueGame();
        }, 2000);
    } else if (isSplit && activeHandCount === 2 && firstHandBust === false) {
        evalSplitGame();
    } else {
        outDiv.style.display = "block";;
    outH2.textContent = message;
    updateMoneyResult(0, "gray");
        endRound();
    }
}

function handlePlayerBlackjack() {
    
    if (isSplit && activeHandCount === 1) {
        activeHandCount++;
        activeHand = splitHand;
        activeCardDiv = splitCardsDiv;
        firstHandScore = playerScore;
        setTimeout(() => {
            continueGame();
        }, 2000);
    } else if (isSplit && activeHandCount === 2 && firstHandBust === false) {
        evalSplitGame()
    } else {
    outDiv.style.display = "block";
    outH2.textContent = "Blackjack! You win!";
    let winAmount = betAmt * 1.5;
    updateMoneyResult(winAmount, "green");
    money += winAmount;
    updateMoneyDisplay();
    setTimeout(() => {
        endRound();
    }, 1000);
}  }

function handleDealerBlackjack() {
    setTimeout(() => {
        revealDealerCard();
        if (insuranceOffered && insuranceBet > 0) {
            money += insuranceBet * 2;
            updateMoneyDisplay();
            outH2.textContent = "Dealer has Blackjack. Your insurance bet wins!";
            outDiv.style.display = "block";
            updateMoneyResult(insuranceBet, "green");
            endRound();
        } else if (isSplit && activeHandCount === 2 && firstHandBust === false) {
            evalSplitGame();
        } else { 
            money -= betAmt;
            updateMoneyDisplay();
            outH2.textContent = "Dealer has Blackjack! You lose.";
            outDiv.style.display = "block";
            updateMoneyResult(-betAmt, "red");
            endRound();
        };
    }, 500);
}

function continueGame() {
    if (isSplit && activeHandCount === 1) {
        setTimeout(() => {activeCardDiv.classList.add('active-player-hand'); }, 500);
    } else if (isSplit && activeHandCount === 2) {
        setTimeout(() => {playerScore = calculateScore(activeHand);
        playerScoreSpan.textContent = "Your Score: " + playerScore;
        playerCardsDiv.classList.remove('active-player-hand');});
        if (activeHand.length === 1) {
            setTimeout(() => {dealCardToHand(activeHand, activeCardDiv); 
            playerScore = calculateScore(activeHand);
            playerScoreSpan.textContent = "Your Score: " + playerScore;}, 750)
            setTimeout(() => {
            activeCardDiv.classList.add('active-player-hand');
            playerScore = calculateScore(activeHand);
            playerScoreSpan.textContent = "Your Score: " + playerScore;
        }, 1500);}
        else {
            setTimeout(() => {
                
                activeCardDiv.classList.add('active-player-hand');
                playerScore = calculateScore(activeHand);
                playerScoreSpan.textContent = "Your Score: " + playerScore;
            }, 1000);}
        }
    

    setTimeout(() => {
        outH2.textContent = isSplit ?  `Hand ${activeHandCount}: Hit or Stand?` : "Hit, Stand, or Double Down?";
        outDiv.style.display = "block";
        moneyResultSpan.innerHTML = "";
    moneyResultSpan.style.display = "none";
    toggleButton(hitBtn, false);
        toggleButton(standBtn, false);
        isSplit ? toggleButton(doubleBtn, true) : toggleButton(doubleBtn, false);
    }, 500);
}


function revealDealerCard() {
    let dealerCardImg = dealerCardsDiv.children[1];
    dealerCardImg.src = `images/cards350px/${dealerHand[1].file}`;
    dealerScoreSpan.textContent = "Dealer Shows: " + dealerScore;
}

function updateMoneyResult(amount, color) {
    moneyResultSpan.style.display = "block";
    moneyResultSpan.textContent = (amount >= 0 ? "+" : "-") + "$" + Math.abs(amount).toLocaleString();
    moneyResultSpan.style.backgroundColor = color;
    moneyResultSpan.style.color = "white";
}

function hit() {
    toggleButton(doubleBtn, true);
    let card = shoe.pop();
    let pic = new Image();
    pic.src = `images/cards350px/${card.file}`;
    setTimeout(() => {
        activeCardDiv.appendChild(pic);
        activeHand.push(card);
        playerScore = calculateScore(activeHand);
        playerScoreSpan.textContent = "Your Score: " + playerScore;
        console.log("Active Hand after hit:", activeHand); // Log activeHand here
        setTimeout(() => {
            if (playerScore === 21) {
                handlePlayerWin();
            } else if (playerScore > 21) {
                handlePlayerBust();
            } else {
                outH2.textContent = "Hit or Stand?";
                moneyResultSpan.innerHTML = "";
                moneyResultSpan.style.display = "none";
            }
        }, 1000);
    }, 1000);
}

function handlePlayerBust() {
    if (isSplit && activeHandCount === 1) {
        activeHandCount++;
        activeHand = splitHand;
        activeCardDiv = splitCardsDiv;
        firstHandBust = true;
        money -= betAmt;
        updateMoneyDisplay();
        outH2.textContent = "You busted!";
        updateMoneyResult(-betAmt, "red");
        setTimeout(() => {
            playerCardsDiv.innerHTML = "";
            playerCardsDiv.style.display = "none";
            continueGame();
        }, 2000);
    } else if (isSplit && activeHandCount === 2 && firstHandBust === false) {
        evalSplitGame();
    } else {
        money -= betAmt;
        updateMoneyDisplay();
    outH2.textContent = "You busted!";
    updateMoneyResult(-betAmt, "red");
        endRound();
    } 
}

function endRound() {
    setTimeout(() => {
        activeHandCount = 1;
        activeHand = playerHand;
        activeCardDiv = playerCardsDiv;
        splitCardsDiv.classList.remove('active-player-hand');
        toggleButton(dealBtn, false);
        betMenu.disabled = false;
        hitBtn.disabled = true;
        standBtn.disabled = true;
        doubleBtn.disabled = true;
        isSplit = false;
    }, 1000);
}

function stand() {
    toggleButton(hitBtn, true);
    toggleButton(standBtn, true);
    toggleButton(doubleBtn, true);

    if (isSplit && activeHandCount === 1) {
        activeHandCount++;
        activeHand = splitHand;
        activeCardDiv = splitCardsDiv;
        firstHandScore = playerScore;
        setTimeout(() => {
            continueGame();
        }, 2000);
    } else {
    setTimeout(() => {
        setTimeout(() => {activeCardDiv.classList.remove('active-player-hand');}, 500);
        revealDealerCard();
        dealerDraw();
    }, 1500);
    }
}

function dealerDraw() {
    let dealerDrawInterval = setInterval(() => {
        if (dealerScore < 17) {
            let card = shoe.pop();
            let pic = new Image();
            pic.src = `images/cards350px/${card.file}`;
            pic.style.width = "105px";
            dealerCardsDiv.appendChild(pic);
            dealerHand.push(card);
            dealerScore = calculateScore(dealerHand);
            dealerScoreSpan.textContent = "Dealer Score: " + dealerScore;
        } else {
            clearInterval(dealerDrawInterval);
            endGame();
        }
    }, 1000);
}

function endGame() {
    setTimeout(() => {
        if (dealerScore > 21) {
            handleDealerBust();
        } else if (dealerScore === 21 && dealerHand.length === 2) {
            handleDealerBlackjack();
        } else if (dealerScore > playerScore) {
            handleDealerWin();
        } else if (dealerScore < playerScore) {
            handlePlayerWin();
        } else {
            handlePush("It's a push!");
        }
        updateMoneyDisplay();
        betAmt = +betMenu.value;
    }, 1000);
}

function handleDealerBust() {
    if (isSplit && activeHandCount === 1) {
        activeHandCount++;
        activeHand = splitHand;
        activeCardDiv = splitCardsDiv;
        setTimeout(() => {
            continueGame();
        }, 2000);
    } else if (isSplit && activeHandCount === 2 && firstHandBust === false) {
        evalSplitGame();
    } else {
        outH2.textContent = "Dealer busted! You win.";
    updateMoneyResult(betAmt, "green");
    money += betAmt;
    updateMoneyDisplay();
        endRound();
    }
}

function handleDealerWin() {
    if (isSplit && activeHandCount === 1) {
        activeHandCount++;
        activeHand = splitHand;
        activeCardDiv = splitCardsDiv;
        setTimeout(() => {
            continueGame();
        }, 2000);
    } else if (isSplit && activeHandCount === 2 && firstHandBust === false) {
        evalSplitGame();
    } else {
        outH2.textContent = "Dealer wins!";
        updateMoneyResult(-betAmt, "red");
        money -= betAmt;
        updateMoneyDisplay();
        endRound();
    }
}

function handlePlayerWin() {
    if (isSplit && activeHandCount === 1) {
        activeHandCount++;
        activeHand = splitHand;
        activeCardDiv = splitCardsDiv;
        setTimeout(() => {
            continueGame();
        }, 2000);
    } else if (isSplit && activeHandCount === 2 && firstHandBust === false) {
        evalSplitGame();
    } else {
        outH2.textContent = "You win!";
        updateMoneyResult(betAmt, "green");
        money += betAmt;
        updateMoneyDisplay();
        endRound();
    }
}

function toggleButton(button, disabled) {
    button.disabled = disabled;
    button.classList.toggle('disabled-btn', disabled);
}

function doubleDown() {
    if (money >= betAmt) {
        let extraBet = betAmt;
        betAmt *= 2;
        updateMoneyDisplay();
        outH2.textContent = `You doubled down! New bet: $${betAmt}`;

        // Add extra chips for the double down
        addExtraChips(extraBet);

        // Deal one more card to the player
        setTimeout(() => {
            let card = shoe.pop();
            let pic = new Image();
            pic.src = `images/cards350px/${card.file}`;
            activeCardDiv.appendChild(pic);
            activeHand.push(card);
            playerScore = calculateScore(activeHand);
            playerScoreSpan.textContent = "Your Score: " + playerScore;

            // Check for bust or 21 after hitting
            setTimeout(() => {
                if (playerScore > 21) {
                    handlePlayerBust();
                } else if (playerScore === 21) {
                    handlePlayerBlackjack();
                } else {
                    // Only stand if the player hasn't busted
                    stand();
                }
            }, 1000);
        }, 2000);

        // Disable all buttons
        toggleButton(hitBtn, true);
        toggleButton(standBtn, true);
        toggleButton(doubleBtn, true);
    } else {
        outH2.textContent = "Not enough money to double down!";
    }
}

function addBetChips() {
    let leftPos = 30;
    betAmt = betMenu.value;
    let data = betMenu.options[betMenu.selectedIndex].dataset.chips;
    let chipsArr = data.split("&");
    let chipsInterval = setInterval(() => {
    let chipVal = chipsArr.shift();
        let pic = new Image();
        pic.src = `images/chips/chip-${chipVal}.png`;
        pic.style.position = "absolute";
        pic.style.width = "120px";
        pic.style.left = leftPos + "px";
        leftPos += 70;
        chipsDiv.appendChild(pic);
        if(!chipsArr.length) { // 
            clearInterval(chipsInterval);;
        }
    }, 1000);
}

function addExtraChips(amount) {
    let rightPos = chipsDiv2.childElementCount * 70 + 30;
    let chipsArr = getChipsForAmount(amount);
    let chipsInterval = setInterval(() => {
        let chipVal = chipsArr.shift();
        let pic = new Image();
        pic.src = `images/chips/chip-${chipVal}.png`;
        pic.style.position = "absolute";
        pic.style.width = "120px";
        pic.style.right = rightPos + "px";
        rightPos += 70;
        chipsDiv2.appendChild(pic);
        if(!chipsArr.length) {
            clearInterval(chipsInterval);
        }
    }, 1000);
}

function getChipsForAmount(amount) {
    const chipValues = [1000, 500, 100, 50, 25, 10, 5];
    let chips = [];
    for (let value of chipValues) {
        while (amount >= value) {
            chips.push(value);
            amount -= value;
        }
    }
    return chips;
}

function evalSplitGame() {
    let firstHandResult = 0;
    let secondHandResult = 0;
    let totalResult = 0;

    // Evaluate first hand (we know it didn't bust)
    if (firstHandScore > dealerScore || dealerScore > 21) {
        firstHandResult = betAmt;
        outH2.textContent = "First hand wins and";
    } else if (firstHandScore < dealerScore) {
        firstHandResult = -betAmt;
        outH2.textContent = "First hand loses and";
    } else {
        outH2.textContent = "First hand pushes and";
    }

    // Evaluate second hand
    if (playerScore > 21) {
        secondHandResult = -betAmt;
        outH2.textContent += " second hand busted.";
    } else if (playerScore > dealerScore || dealerScore > 21) {
        secondHandResult = betAmt;
        outH2.textContent += " second hand wins!";
    } else if (playerScore < dealerScore) {
        secondHandResult = -betAmt;
        outH2.textContent += " second hand loses.";
    } else {
        outH2.textContent += " second hand pushes.";
    }

    // Calculate total result
    totalResult = firstHandResult + secondHandResult;
    money += totalResult;

    // Update display
    updateMoneyDisplay();
    updateMoneyResult(totalResult, totalResult == 0 ? "gray" : totalResult > 0 ? "green" : "red");

    // End the round
    endRound();
}

// Add this function to help debug
function logGameState() {
    console.log("Player Hand:", playerHand);
    console.log("Split Hand:", splitHand);
    console.log("Active Hand:", activeHand);
    console.log("Is Split:", isSplit);
    console.log("Active Hand Count:", activeHandCount);
}

// Call this function at key points in your game logic

// Add this function to toggle the tutorial visibility
function toggleTutorial() {
    if (tutorialDiv.style.display === 'none' || tutorialDiv.style.display === '') {
        tutorialDiv.style.display = 'block';
    } else {
        tutorialDiv.style.display = 'none';
    }
}
var Monopoly = {};
Monopoly.allowRoll = true;
Monopoly.moneyAtStart = 1000;
Monopoly.doubleCounter = 0;

Monopoly.init = function(){ //Initializes the monopoly board
    $(document).ready(function(){
        Monopoly.adjustBoardSize();
        $(window).bind("resize",Monopoly.adjustBoardSize);
        Monopoly.initDice();
        Monopoly.initPopups();
        Monopoly.start();        
    });
};
Monopoly.start = function(){ //Shows the introduction
    Monopoly.showPopup("intro")
};
Monopoly.initDice = function(){ //Creates the dice
    $(".dice").click(function(){
        if (Monopoly.allowRoll){
            Monopoly.rollDice(); //Rolls the dice
        }
    });
};
Monopoly.getCurrentPlayer = function(){
    return $(".player.current-turn");
};
Monopoly.getPlayersCell = function(player){
    return player.closest(".cell");
};
Monopoly.getPlayersMoney = function(player){
    return parseInt(player.attr("data-money"));
};
Monopoly.updatePlayersMoney = function(player,amount){
    //Get amount of current player
    var playersMoney = parseInt(player.attr("data-money"));
    //Add amount
    playersMoney += parseInt(amount);
    if (playersMoney <= 0 ){
        let popup = Monopoly.getPopup('broke');//Alerts the player if he has no money to play
        popup.find('#text-placeholder').text(player[0].id);
        popup.find("button").unbind("click").bind("click", function() {
            Monopoly.closePopup("broke");
            Monopoly.setNextPlayerTurn();
        });
        Monopoly.showPopup('broke');

    }
    player.attr("data-money",playersMoney);
    player.attr("title",player.attr("id") + ": $" + playersMoney);
    Monopoly.playSound("chaching");
};
Monopoly.rollDice = function(){
    //Randomize dice rolls
    var result1 = Math.floor(Math.random() * 6) + 1 ;
    var result2 = Math.floor(Math.random() * 6) + 1 ;
    $(".dice").find(".dice-dot").css("opacity",0);
    $(".dice#dice1").attr("data-num",result1).find(".dice-dot.num" + result1).css("opacity",1);
    $(".dice#dice2").attr("data-num",result2).find(".dice-dot.num" + result2).css("opacity",1);
    //Double rolls
    if (result1 == result2){
        Monopoly.doubleCounter++;
    } else {
        Monopoly.doubleCounter = 0;
    }
    //Move player
    var currentPlayer = Monopoly.getCurrentPlayer();
    Monopoly.handleAction(currentPlayer,"move",result1 + result2);
};
Monopoly.movePlayer = function(player,steps){
    //Player can't roll again until finished turn
    Monopoly.allowRoll = false;
    var playerMovementInterval = setInterval(function(){
        if (steps == 0){
            clearInterval(playerMovementInterval);
            Monopoly.handleTurn(player);
        }else{
            var playerCell = Monopoly.getPlayersCell(player);
            var nextCell = Monopoly.getNextCell(playerCell);
            $(player).removeClass('happy');

            nextCell.find(".content").append(player);
            steps--;
        }
    },200);
};
Monopoly.handleTurn = function(){
    var player = Monopoly.getCurrentPlayer();
    var playerCell = Monopoly.getPlayersCell(player);
    if (playerCell.is(".available.property")){
        Monopoly.handleBuyProperty(player,playerCell);
    }else if(playerCell.is(".property:not(.available)") && !playerCell.hasClass(player.attr("id"))){
         Monopoly.handlePayRent(player,playerCell);
    }else if(playerCell.is(".property:not(.available)") && playerCell.hasClass(player.attr("id"))) {
        player.addClass('happy');
    }else if(playerCell.is(".go-to-jail")){
        Monopoly.handleGoToJail(player);
    }else if(playerCell.is(".chance")){
        Monopoly.handleChanceCard(player);
    }else if(playerCell.is(".community")){
        Monopoly.handleCommunityCard(player);
    }else{
        $(player).removeClass('happy');
        Monopoly.setNextPlayerTurn();
    }
}
Monopoly.setNextPlayerTurn = function(){
    var currentPlayerTurn = Monopoly.getCurrentPlayer();
    var playerId = parseInt(currentPlayerTurn.attr("id").replace("player",""));//First player replaced
    var nextPlayerId = playerId + 1;
      // If player has a double, play again
    if (Monopoly.doubleCounter > 0) {
        nextPlayerId = playerId;
    }
    // If all players played, turn goes back to player 1
    if (nextPlayerId > $(".player").length){
        nextPlayerId = 1;
    }
    currentPlayerTurn.removeClass("current-turn");
    var nextPlayer = $(".player#player" + nextPlayerId);
    if (!nextPlayer) {
        nextPlayerId++;
        if (nextPlayerId > $(".player").length){
            nextPlayerId = 1;
        }
        nextPlayer = $(".player#player" + nextPlayerId);
    }
    nextPlayer.addClass("current-turn");

    if (nextPlayer.is(".jailed")){
        var currentJailTime = parseInt(nextPlayer.attr("data-jail-time"));
        currentJailTime++;
        nextPlayer.attr("data-jail-time",currentJailTime);
        if (currentJailTime > 3){
            nextPlayer.removeClass("jailed");
            nextPlayer.removeAttr("data-jail-time");
        }
        Monopoly.setNextPlayerTurn();
        return;
    }
        if (currentPlayerTurn.data('money') <= 0) {
        let properties = $('.cell.property');

        $.each(properties, function(index, property) {
            if ($(property).data('owner') == $(currentPlayerTurn).attr('id')) {
                $(property).data('owner', '');
                $(property).removeClass(currentPlayerTurn.attr('id'));
            }
        });

        currentPlayerTurn.remove();
    } else {
    Monopoly.closePopup();
    }
    Monopoly.allowRoll = true;
};
Monopoly.handleBuyProperty = function(player,propertyCell){//Buy Property
    var propertyCost = Monopoly.calculateProperyCost(propertyCell);
    var popup = Monopoly.getPopup("buy");
    popup.find(".cell-price").text(propertyCost);
    popup.find("button").unbind("click").bind("click",function(){
        var clickedBtn = $(this);
        if (clickedBtn.is("#yes")){
            Monopoly.handleBuy(player,propertyCell,propertyCost);
        }else{
            Monopoly.closeAndNextTurn();
        }
    });
    Monopoly.showPopup("buy");
};
Monopoly.handlePayRent = function(player,propertyCell){//Rent Property
    var popup = Monopoly.getPopup("pay");
    var currentRent = parseInt(propertyCell.attr("data-rent"));
    var properyOwnerId = propertyCell.attr("data-owner");
    popup.find("#player-placeholder").text(properyOwnerId);
    popup.find("#amount-placeholder").text(currentRent);
    popup.find("button").unbind("click").bind("click",function(){
        var properyOwner = $(".player#"+ properyOwnerId);
        console.log(properyOwnerId)
        Monopoly.updatePlayersMoney(player,currentRent);
        Monopoly.updatePlayersMoney(properyOwner,-1*currentRent);
        Monopoly.closeAndNextTurn();
    });
   Monopoly.showPopup("pay");
};
Monopoly.handleGoToJail = function(player){
    var popup = Monopoly.getPopup("jail");
    popup.find("button").unbind("click").bind("click",function(){
        Monopoly.handleAction(player,"jail");
    });
    Monopoly.showPopup("jail");
};
Monopoly.handleChanceCard = function(player){//Chance Card
    var popup = Monopoly.getPopup("chance");
    popup.find(".popup-content").addClass("loading-state");
    $.get("https://itcmonopoly.appspot.com/get_random_chance_card", function(chanceJson){
        popup.find(".popup-content #text-placeholder").text(chanceJson["content"]);
        popup.find(".popup-title").text(chanceJson["title"]);
        popup.find(".popup-content").removeClass("loading-state");
        popup.find(".popup-content button").attr("data-action",chanceJson["action"]).attr("data-amount",chanceJson["amount"]);
    },"json");
    popup.find("button").unbind("click").bind("click",function(){
        var currentBtn = $(this);
        var action = currentBtn.attr("data-action");
        var amount = currentBtn.attr("data-amount");
        Monopoly.handleAction(player,action,amount);
    });
    Monopoly.showPopup("chance");
};
Monopoly.handleCommunityCard = function(player){//Community Card
    var popup = Monopoly.getPopup("community");
    popup.find(".popup-content").addClass("loading-state");
    $.get("https://itcmonopoly.appspot.com/get_random_community_card", function(chanceJson){
        popup.find(".popup-content #text-placeholder").text(chanceJson["content"]);
        popup.find(".popup-title").text(chanceJson["title"]);
        popup.find(".popup-content").removeClass("loading-state");
        popup.find(".popup-content button").attr("data-action",chanceJson["action"]).attr("data-amount",chanceJson["amount"]);
    },"json");
    popup.find("button").unbind("click").bind("click",function(){
        var currentBtn = $(this);
        var action = currentBtn.attr("data-action");
        var amount = currentBtn.attr("data-amount");
        Monopoly.handleAction(player,action,amount);
    });
    Monopoly.setNextPlayerTurn();
};
Monopoly.sendToJail = function(player){//Jail
    player.addClass("jailed");
    player.attr("data-jail-time",1);
    $(".corner.game.cell.in-jail").append(player);
    Monopoly.playSound("woopwoop");
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};
Monopoly.getPopup = function(popupId){
    return $(".popup-lightbox .popup-page#" + popupId);
};
Monopoly.calculateProperyCost = function(propertyCell){
    var cellGroup = propertyCell.attr("data-group");
    var cellPrice = parseInt(cellGroup.replace("group","")) * 5;
    if (cellGroup == "rail"){
        cellPrice = 10;
    }
    return cellPrice;
};
Monopoly.calculateProperyRent = function(propertyCost){ //Property Rent Prices
    return propertyCost/2;
};
Monopoly.closeAndNextTurn = function(){
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};
Monopoly.initPopups = function(){
    $(".popup-page#intro").find("button").click(function(){
        var numOfPlayers = $(this).closest(".popup-page").find("input").val();
        if (Monopoly.isValidInput("numofplayers",numOfPlayers)){
            Monopoly.createPlayers(numOfPlayers);
            Monopoly.closePopup();
        }
    });
};
Monopoly.handleBuy = function(player,propertyCell,propertyCost){
    var playersMoney = Monopoly.getPlayersMoney(player)
    if (playersMoney < propertyCost){ // If player doesnt have enough money show error msg, doesn't let him buy
        Monopoly.showErrorMsg();
        Monopoly.playSound('error');
    }else{ // Adds happy face to player because he is on his property
        Monopoly.updatePlayersMoney(player, -1 * propertyCost);
        var rent = Monopoly.calculateProperyRent(propertyCost);

        propertyCell.removeClass("available")
                    .addClass(player.attr("id"))
                    .attr("data-owner",player.attr("id"))
                    .attr("data-rent",rent);
        player.addClass('happy');
        Monopoly.setNextPlayerTurn();
    }
};
Monopoly.handleAction = function(player,action,amount){
    switch(action){
        case "move":
            Monopoly.movePlayer(player,amount);
             break;
        case "pay":
            Monopoly.updatePlayersMoney(player,amount);
            Monopoly.setNextPlayerTurn();
            break;
        case "jail":
            Monopoly.sendToJail(player);
            break;
    };
    Monopoly.closePopup();
};
Monopoly.createPlayers = function(numOfPlayers){
    var startCell = $(".go");
    for (var i=1; i<= numOfPlayers; i++){
        var player = $("<div />").addClass("player shadowed").attr("id","player" + i).attr("title","player" + i + ": $" + Monopoly.moneyAtStart);
        startCell.find(".content").append(player);
        if (i==1){
            player.addClass("current-turn");
        }
        player.attr("data-money",Monopoly.moneyAtStart);
    }
};
Monopoly.getNextCell = function(cell){
    var currentCellId = parseInt(cell.attr("id").replace("cell",""));
    var nextCellId = currentCellId + 1
    if (nextCellId > 40){
        console.log("YAY")
        Monopoly.handlePassedGo();
        nextCellId = 1;
    }
    return $(".cell#cell" + nextCellId);
};
Monopoly.handlePassedGo = function(){
    var player = Monopoly.getCurrentPlayer();
    Monopoly.updatePlayersMoney(player,Monopoly.moneyAtStart/10);
};
Monopoly.isValidInput = function(validate,value){
    var isValid = false;
        switch(validate){
        case "numofplayers":
            if(value >= 1 && value <= 4){//1-4 players
                isValid = true;
            }
            break;
    }

    if (!isValid){
        Monopoly.showErrorMsg();
    }
    return isValid;

}
Monopoly.showErrorMsg = function(){
    $(".popup-page .invalid-error").fadeTo(500,1);
    setTimeout(function(){
            $(".popup-page .invalid-error").fadeTo(500,0);
    },2000);
};
Monopoly.adjustBoardSize = function(){
    var gameBoard = $(".board");
    var boardSize = Math.min($(window).height(),$(window).width());
    boardSize -= parseInt(gameBoard.css("margin-top")) *2;
    $(".board").css({"height":boardSize,"width":boardSize});
}
Monopoly.closePopup = function(){
    $(".popup-lightbox").fadeOut();
};
Monopoly.playSound = function(sound){ //Access game sounds
    var snd = new Audio("./sounds/" + sound + ".wav"); 
    snd.play();
}
Monopoly.showPopup = function(popupId){
    $(".popup-lightbox .popup-page").hide();
    $(".popup-lightbox .popup-page#" + popupId).show();
    $(".popup-lightbox").fadeIn();
};
Monopoly.init();
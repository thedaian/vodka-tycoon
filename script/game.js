'use strict';


function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* Controllers 
	This is the main (and only) controller for Vodka Tycoon.
	This handles all the player actions, as well as contains various scope variables and a few other elements
*/
function vodkaTycoon( $scope, $timeout, $log ) {
	/* INITIALIZATION */
    $scope.money = 200;
	$scope.price = 0;
	$scope.cups = 0;
	$scope.vodka = {
		bottles: 0,
		pours: 0
	};
	$scope.weather = {
		forecast: 0,
		current: 0
	};
	$scope.time = {
		day: 0,
		hour: 21,
		minute: 0
	};
	$scope.buy = {
		vodka: 0,
		cups: 0,
		price: 0,
		total: 0,
		cant: false
	};
	$scope.running = false;
	$scope.showIncome = false;
	$scope.profit = [];
	
	var PRICE_VODKA = 30;
	var PRICE_CUPS = 12;
	
	$scope.cost = {
		vodka: PRICE_VODKA,
		cups: PRICE_CUPS
	};
	
	//Initialises variables for the next "day". This gets called whenever we are starting the new day (usually after the user clicks "OK" to close out of the finance window bit....
	function initDay()
	{
		$scope.showIncome = false;
		$scope.time.hour = 21;
		$scope.time.minute = 0;
		$scope.weather.forecast = randomInt(-10, 15);
		$scope.profit.push({
			start: $scope.money,
			end: 0,
			income: 0,
			hourly: 0
		});
		$scope.time.day++;
	}
	
	initDay();
	
	/* PLAYER ACTIONS */
	/* Functions that are tied to the scope can be called in the HTML (see the index.html for examples) this basically means you can do something like ng-click=function() and it's all handled nicely
	
	The start day function gets the process of the simulation itself running
	*/
	$scope.startDay = function()
	{
		if(outOfCups() || outOfVodka() || ($scope.price === 0) )
		{
			return;
		}
		$scope.weather.current = $scope.weather.forecast + randomInt(-5, 5);
		pour();
		$scope.running = true;
		runTime();
	}
	
	/* Actually does the buying of cups and vodka. */
	$scope.purchase = function()
	{
		if($scope.buy.cant)
		{
			return;
		}
		if( ($scope.buy.vodka < 0) || ($scope.buy.cups < 0) )
		{
			return;
		}
		
		$scope.money -= $scope.buy.total;
		$scope.vodka.bottles += $scope.buy.vodka;
		$scope.cups += $scope.buy.cups * 12;
		$scope.price = $scope.buy.price;
		
		$scope.buy.vodka = 0;
		$scope.buy.cups = 0;
	}
	
	$scope.nextDay = initDay;
	
	/* GAME INTERFACE ACTIONS */  
	var CHANCE_OF_CUSTOMER = 90;
	var STOP_HOUR = 7;
	var timer;
	
	//turns bottles into "pours", effectively forcing the player to use those pours or they get lost. bottles are saved per day.
	function pour()
	{
		if(!outOfBottles())
		{
			$scope.vodka.bottles--;
			$scope.vodka.pours += 16;
		}
	}
	
	//checks whether a customer will actually buy some vodka at the current price (based on weather), and if so, purchases a shot of vodka
	function customer(force)
	{
		var force = force || false;
		if(!outOfVodka() && !outOfCups() && checkWeatherToPrice(force))
		{
			$scope.money += $scope.price;
			$scope.vodka.pours--;
			$scope.cups--;
			if($scope.vodka.pours === 0)
			{
				pour();
			}
		}
	}
	
	//does exactly what it says. the possible "max price" depends highly on the current temperature, with low temps having a higher max price
	function checkWeatherToPrice(force)
	{
		if(force)
			return ($scope.price < 10);
		
		var maxPrice = 0;
		if($scope.weather.current < -5)
		{
			maxPrice = 5;
		} else if( ($scope.weather.current >= -5) && ($scope.weather.current < 0) )
		{
			maxPrice = 4.5;
		} else if( ($scope.weather.current >= 0) && ($scope.weather.current < 5) )
		{
			maxPrice = 4;
		} else if( ($scope.weather.current >= 5) && ($scope.weather.current < 10) )
		{
			maxPrice = 3.5;
		} else if( ($scope.weather.current >= 10) && ($scope.weather.current < 16) )
		{
			maxPrice = 3;
		}
		
		return (maxPrice >= $scope.price);
	}
	
	//simply advances time forward. every hour, the temp drops a bit, and a customer WILL buy vodka (provided the price is still below 10)
	function advanceTime()
	{
		$scope.time.minute += 5;
		if($scope.time.minute >= 60)
		{
			$scope.weather.current -= 0.75;
			$scope.time.hour++;
			$scope.time.minute = 0;
			customer(true);
			if($scope.time.hour === 24)
			{
				$scope.time.hour = 0;
			}
		}
	}
	
	//this is where the main game loop takes place.
	function runTime()
	{
		if(randomInt(0, 100) <= CHANCE_OF_CUSTOMER)
		{
			customer();
		}
		advanceTime();
		if(outOfVodka() || outOfCups() || ($scope.time.hour === STOP_HOUR))
		{
			endDay();
		}
		if($scope.running) {
			//angularJS $timeout function. works similar to window.timeout, but avoids any cross platform issues, and is useful for unit testing
			timer = $timeout(runTime, 250); //26.25 seconds total
		}
	}
	
	//stops the game, and performs all the income/profit display stuff
	function endDay()
	{
		$scope.running = false;
		$timeout.cancel(timer);
		$scope.vodka.bottles = Math.floor($scope.vodka.bottles/2);
		$scope.vodka.pours = 0;		
		calculateProfit();
		
		$scope.showIncome = true;
	}
	
	//does the actual calculating of the income and expenses and such
	//this is all stored in a scope variable that's an array of objects, which is instantly updated on the client html by angular
	function calculateProfit()
	{
		var i = $scope.time.day - 1;
		$scope.profit[i].end = $scope.money;
		$scope.profit[i].income = $scope.profit[i].end - $scope.profit[i].start;
		$scope.profit[i].hourly = $scope.profit[i].income/( (24 - STOP_HOUR) - 9);
	}
	
	//mostly basic sanity checks to prvent abuse or to stop the day early if one of the supplies runs out
	function outOfVodka()
	{
		return ( ($scope.vodka.pours === 0) && ($scope.vodka.bottles === 0) );
	}
	function outOfBottles()
	{
		return ($scope.vodka.bottles === 0);
	}
	function outOfCups()
	{
		return ($scope.cups === 0);
	}
	function priceOutOfBounds()
	{
		return (($scope.price <= 0) || ($scope.price > 10));
	}
	
	//because we use the sanity check functions in the controller itself, we declare them above, then attatch them to the scope object here, so we can use them in the html template as well
	$scope.outOfVodka = outOfVodka;
	$scope.outOfBottles = outOfBottles;
	$scope.outOfCups = outOfCups;
	$scope.priceOutOfBounds = priceOutOfBounds; 
	
	//this allows us to run a function (recalc cost in this case) whenever a scope variable changes. in this case, we display the total cost of the purchase whenever one value or the other changes
	$scope.$watch('buy.vodka', recalcCost);
	$scope.$watch('buy.cups', recalcCost);
	
	function recalcCost()
	{
		$scope.buy.total = ($scope.buy.vodka * PRICE_VODKA) + ($scope.buy.cups * PRICE_CUPS);
		$scope.buy.cant = ($scope.money < $scope.buy.total);
	}
	
}
//in case the code is ever minified, we need to $inject the correct variables into the controller (basically, the services the controller uses when declaring it above). This is mostly due to IE, but it's generally good practice
vodkaTycoon.$inject = ['$scope', '$timeout', '$log'];

//filters are useful for display stuff. such as converting C to F, or converting objects into a single string. they should ideally be fairly simple functions, though, as they get run twice on every page load
//use directives for more complex functionality
angular.module('app', []).filter('tof', function() {
	return function(input) {
		return Math.floor(input * 1.8 + 32) + "°F";
	}
}).filter('easyTime', function() {
	return function(input) {
		var result = input.hour + ":";
		if(input.minute < 10)
		{
			return result + "0" + input.minute;
		}
		return result + input.minute;
	}
});
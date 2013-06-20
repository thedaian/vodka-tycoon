'use strict';


function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* Controllers */
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
	
	function pour()
	{
		if(!outOfBottles())
		{
			$scope.vodka.bottles--;
			$scope.vodka.pours += 16;
		}
	}
	
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
	
	function checkWeatherToPrice(force)
	{
		if(force)
			return true;
		
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
			timer = $timeout(runTime, 250); //26.25 seconds total
		}
	}
	
	function endDay()
	{
		$scope.running = false;
		$timeout.cancel(timer);
		$scope.vodka.bottles = Math.floor($scope.vodka.bottles/2);
		$scope.vodka.pours = 0;		
		calculateProfit();
		
		$scope.showIncome = true;
	}
	
	function calculateProfit()
	{
		var i = $scope.time.day - 1;
		$scope.profit[i].end = $scope.money;
		$scope.profit[i].income = $scope.profit[i].end - $scope.profit[i].start;
		$scope.profit[i].hourly = $scope.profit[i].income/( (24 - STOP_HOUR) - 9);
	}
	
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
	
	$scope.outOfVodka = outOfVodka;
	$scope.outOfBottles = outOfBottles;
	$scope.outOfCups = outOfCups;
	$scope.priceOutOfBounds = priceOutOfBounds; 
	
	$scope.$watch('buy.vodka', recalcCost);
	$scope.$watch('buy.cups', recalcCost);
	
	function recalcCost()
	{
		$scope.buy.total = ($scope.buy.vodka * PRICE_VODKA) + ($scope.buy.cups * PRICE_CUPS);
		$scope.buy.cant = ($scope.money < $scope.buy.total);
	}
	
}
vodkaTycoon.$inject = ['$scope', '$timeout', '$log'];

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
'use strict';
angular.module('permitCalc', ['ngTouch']).factory('permitFactory', function($http, $q, $filter){
	var permitFactory = {};
	permitFactory.getIccBvd = function (short_name) {
		var d = $q.defer();
		$http({
			url: 'iccbvd.json'
		}).success(function (data) {
			d.resolve(data);
		});
		return d.promise;
	};
	
	return permitFactory;
}).directive('permitCalc', function () {
	return {
		retrict: 'E',
		// template: '<div><select ng-options="group as group.group for group in groups" ng-model="selectedGroup"></select><br/><select ng-options="param as param for param in params" ng-model="selectedParam"></select><br/>{{selectedGroup[selectedParam]}}<br/><input ng-model="squareFeet"></input><br/>{{calculateValuation() | currency}}<br/>{{calculateBuildingPermit() | currency}}<br/>{{calculatePlanReviewFee(percents.planReview.all) | currency}}<br/>{{calculateElectricalPermit(percents.electricalPermit.all) | currency}}<br/>{{calculatePlumbingPermit(percents.plumbingPermit.all) | currency}}<br/>{{calculateMechanicalPermit(percents.mechanicalPermit.all) | currency}}<br/>{{calculateTotalPrice() | currency}}<br/>{{(totalPrice/valuation) * 100 | number: 2}}%</div>',
		template: '<table><tbody><tr><td>Building Type</td><td><select ng-options="group as group.group for group in groups" ng-model="selectedGroup"></select></td></tr><tr><td>Construction Type</td><td><select ng-options="param as param for param in params" ng-model="selectedParam"></select></td></tr><tr><td>Valuation Multiplier</td><td>{{selectedGroup[selectedParam]}}</td></tr><tr><td>Square Feet</td><td><input type="number" ng-model="squareFeet"/></td><tr><td>Means Location Factor</td><td>{{meansLocationFactor * 100 | number: 2}}%</td></tr><tr><td>Construction Valuation</td><td>{{calculateValuation() | currency}}</td><tr><td>Building Permit</td><td>{{calculateBuildingPermit() | currency}}</td></tr><tr><td>Plan Review Fee</td><td>{{calculatePlanReviewFee(percents.planReview.all) | currency}}</td></tr><tr><td>Electrical Permit</td><td>{{calculateElectricalPermit(percents.electricalPermit.all) | currency}}</td></tr><tr><td>Plumbing Permit</td><td>{{calculatePlumbingPermit(percents.plumbingPermit.all) | currency}}</td></tr><tr><td>Mechanical Permit</td><td>{{calculateMechanicalPermit(percents.mechanicalPermit.all) | currency}}</td></tr><tr><td><strong>Total Permit Price</strong></td><td><strong>{{calculateTotalPrice() | currency}}</strong></td></tr><tr><td>% of Valuation</td><td>{{(totalPrice/valuation) * 100 | number: 2}}%</td></tr></tbody></table>',
		controller: function ($scope, $rootScope, $filter, $interval, permitFactory, $timeout) {
			$scope.params = ['IA', 'IB', 'IIA', 'IIB', 'IIIA', 'IIIB', 'IV', 'VA', 'VB'];
			$scope.meansLocationFactor = 0.838137101;
			
			$scope.totalPrice = 0;
			$scope.squareFeet = 0;
			
			$scope.percents = {buildingPermit: {all: 0.00077944778071331, r3: 0.002616923}, planReview: {all: 0.550907693344574, r3: 0.717419837103396}, electricalPermit: {all: 1.00793835113169, r3: 0.669736429687697}, plumbingPermit: {all: 0.551694198410728, r3: 0.223647600095625}, mechanicalPermit: {all: 0.778591078767941, r3: 0.305407886978742}};			
			permitFactory.getIccBvd().then(function (data) {
				$scope.groups = data;									
			});
				$scope.calculateValuation = function () {

					if ($scope.selectedGroup && $scope.selectedParam) {
						$scope.valuation =  $scope.meansLocationFactor * $scope.selectedGroup[$scope.selectedParam] * $scope.squareFeet;						
					} else {
						$scope.valuation = 0;
					}

					return $scope.valuation;
				};
				$scope.calculateBuildingPermit = function () {
					if ($scope.selectedGroup && $scope.selectedParam) {
						var percent = ($scope.selectedGroup.group === 'R-3 Residential, one- and two-family') ? $scope.percents.buildingPermit.r3 : $scope.percents.buildingPermit.all;
						$scope.buildingPermitFee =  percent * $scope.valuation;						
					} else {
						$scope.buildingPermitFee = 0;
					}

					return $scope.buildingPermitFee;
				};
				$scope.calculatePlanReviewFee = function (percent) {
					if ($scope.buildingPermitFee > 0) {
						var percent = ($scope.selectedGroup.group === 'R-3 Residential, one- and two-family') ? $scope.percents.planReview.r3 : $scope.percents.planReview.all;						
						$scope.planReviewFee = $scope.buildingPermitFee * percent;
					} else {
						$scope.planReviewFee = 0;
					}
					return $scope.planReviewFee;
				};
				$scope.calculateElectricalPermit = function (percent) {
					if ($scope.buildingPermitFee > 0) {
						var percent = ($scope.selectedGroup.group === 'R-3 Residential, one- and two-family') ? $scope.percents.electricalPermit.r3 : $scope.percents.electricalPermit.all;							
						$scope.electricalPermit = $scope.buildingPermitFee * percent;
					} else {
						$scope.electricalPermit = 0;
					}
					return $scope.electricalPermit;
				};		
				$scope.calculatePlumbingPermit = function (percent) {
					if ($scope.buildingPermitFee > 0) {
						var percent = ($scope.selectedGroup.group === 'R-3 Residential, one- and two-family') ? $scope.percents.plumbingPermit.r3 : $scope.percents.plumbingPermit.all;							
						$scope.plumbingPermit = $scope.buildingPermitFee * percent;
					} else {
						$scope.plumbingPermit = 0;
					}
					return $scope.plumbingPermit;
				};	
				$scope.calculateMechanicalPermit = function (percent) {
					if ($scope.buildingPermitFee > 0) {
						var percent = ($scope.selectedGroup.group === 'R-3 Residential, one- and two-family') ? $scope.percents.mechanicalPermit.r3 : $scope.percents.mechanicalPermit.all;							
						$scope.mechanicalPermit = $scope.buildingPermitFee * percent;
					} else {
						$scope.mechanicalPermit = 0;
					}
					return $scope.mechanicalPermit;
				};
				$scope.calculateTotalPrice = function () {
					$scope.totalPrice = $scope.buildingPermitFee + $scope.planReviewFee + $scope.electricalPermit + $scope.plumbingPermit + $scope.mechanicalPermit;
					if ($scope.totalPrice < 106) {
						$scope.totalPrice = 106;
					}
					return $scope.totalPrice;

				}			
		}
	}
}).directive('routeList', function () {
	return {
		restrict: 'E',
		template: 
		'<div id="schedule">'+
				'<ul class="busList"><li ng-click="routeClick(route.route_id)" ng-repeat="route in routes | orderBy: ' + "'short_name'" +'" ng-model="route">{{route.short_name}} - {{route.long_name}}</li>'+
				'</ul></div>',
		controller: function ($scope, $rootScope, $location) {
			$scope.transitSearch = "";
			$scope.over = false;
			$scope.times = [
				{value: 10, label:'Arriving in under 10 minutes'},
				{value: 20, label:'Arriving in under 20 minutes'},
				{value: 30, label:'Arriving in under 30 minutes'},
				{value: 40, label:'Arriving in under 40 minutes'},
				{value: 50, label:'Arriving in under 50 minutes'},
				{value: 60, label:'Arriving in under 60 minutes'}];
			$scope.routeClick = function (id) {


			}
			$scope.stopOver = function (stop) {
				if (!$scope.over) {
					if (!$scope.highlightedStop) {
						$scope.highlightedStop = L.layerGroup().addTo($rootScope.map)
					}

					L.circleMarker([stop.location.lat, stop.location.lng], {opacity: 1, fillOpacity: 1, fillColor: 'yellow', color: 'white', weight: 1}).bindLabel(stop.stop_name, {noHide: true}).addTo($scope.highlightedStop);
					$scope.over = true;					
				}
			
			};
			$scope.stopLeave = function () {
				$scope.highlightedStop.clearLayers();
				$scope.over = false;
			};
			$scope.estimateFilter = function (estimate) {
		        return estimate.time <= $scope.selectedTime.value && estimate.time > 0.01;
		    };		
			$scope.stopFilter = function (estimate) {
		        return estimate.code.indexOf($scope.transitSearch) > -1 || estimate.stop_name.toUpperCase().indexOf($scope.transitSearch.toUpperCase()) > -1;
		    };				    
		}
	}
});
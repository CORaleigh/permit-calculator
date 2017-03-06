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
		template: '<table><tbody><tr><td>Building Type</td><td><select ng-options="group as group.group for group in groups" ng-model="selectedGroup"></select></td></tr><tr><td>Construction Type</td><td><select ng-options="param as param for param in params" ng-model="selectedParam"></select></td></tr><tr><td>Scope of Construction</td><td><select ng-options="constructionScope as constructionScope.name for constructionScope in constructionScopes" ng-model="selectedconstructionScope"></select></td><tr><td>Square Feet</td><td><input type="number" ng-model="squareFeet"/></td></tr><tr><td>Construction Valuation</td><td>{{calculateValuation() | currency}}</td><tr><td>Building Permit</td><td>{{calculateBuildingPermit() | currency}}</td></tr><tr><td>Plan Review Fee</td><td>{{calculatePlanReviewFee(percents.planReview.all) | currency}}</td></tr><tr><td>Electrical Permit</td><td>{{calculateElectricalPermit(percents.electricalPermit.all) | currency}}</td></tr><tr><td>Plumbing Permit</td><td>{{calculatePlumbingPermit(percents.plumbingPermit.all) | currency}}</td></tr><tr><td>Mechanical Permit</td><td>{{calculateMechanicalPermit(percents.mechanicalPermit.all) | currency}}</td></tr><tr><td><strong>Total Permit Price</strong></td><td><strong>{{calculateTotalPrice() | currency}}</strong></td></tr><tr><td>% of Valuation</td><td>{{(totalPrice/valuation) * 100 | number: 2}}%</td></tr></tbody></table>',
		controller: function ($scope, $rootScope, $filter, $interval, permitFactory, $timeout) {
			$scope.params = ['IA', 'IB', 'IIA', 'IIB', 'IIIA', 'IIIB', 'IV', 'VA', 'VB'];
			$scope.meansLocationFactor = 0.838137101;

			$scope.totalPrice = 0;
			$scope.squareFeet = 0;

			$scope.constructionScopes = [{name: 'New Construction', percent: 1}, {name: 'Level 1 Alteration', percent: 0.25}, {name: 'Level 2 Alteration', percent: 0.5}, {name: 'Level 3 Alteration', percent: 0.75}];
			$scope.selectedconstructionScope = $scope.constructionScopes[0];
			$scope.percents = {buildingPermit: {all: 0.00077944778071331, r3: 0.002616923}, planReview: {all: 0.550907693344574, r3: 0.717419837103396}, electricalPermit: {all: 1.00793835113169, r3: 0.669736429687697}, plumbingPermit: {all: 0.551694198410728, r3: 0.223647600095625}, mechanicalPermit: {all: 0.778591078767941, r3: 0.305407886978742}};
			permitFactory.getIccBvd().then(function (data) {
				$scope.groups = data;
			});
				$scope.calculateValuation = function () {

					if ($scope.selectedGroup && $scope.selectedParam) {
						$scope.valuation =  $scope.meansLocationFactor * $scope.selectedGroup[$scope.selectedParam] * $scope.squareFeet;
						$scope.valuation = $scope.valuation * $scope.selectedconstructionScope.percent;
					} else {
						$scope.valuation = 0;
					}

					return $scope.valuation;
				};
				var getCostPer1000 = function (percent) {
					return ((0.000779448071331 * 1000) * percent) * 1
				};

				var setValuationTiers = function () {
					var multiplier = 0.00077944778071331;
					var recoveryBasis = 1;
					var tiers = [
						{tier: 1, min: 0, max: 150000, percent: 1},
						{tier: 2, min: 150001, max: 250000, percent: 0.95},
						{tier: 3, min: 250001, max: 500000, percent: 0.92},
						{tier: 4, min: 500001, max: 750000, percent: 0.90},
						{tier: 5, min: 750001, max: 1000000, percent: 0.88},
						{tier: 6, min: 1000001, max: 5000000, percent: 0.80},
						{tier: 7, min: 5000001, max: 15000000, percent: 0.70},
						{tier: 8, min: 15000001, max: 25000000, percent: 0.60},
						{tier: 9, min: 25000001, max: null, percent: 0.50}
					];
					tiers.forEach(function (tier, i) {
						tier.costper = ((multiplier * 1000) * tier.percent) * recoveryBasis;
						if (i === 0) {
							tier.cumulative = (tier.max / 1000) * tier.costper;
						} else if (i === tiers.length - 1){
							tier.cumulative = null;
						}else {
							tier.cumulative = (((tier.max - tier.min) / 1000) * tier.costper) + tiers[i - 1]['cumulative'];
						}
					});
					return tiers;
				}
				var valuationTiers = setValuationTiers();
				$scope.calculateBuildingPermit = function () {
					var costPer = 0;
					if ($scope.selectedGroup && $scope.selectedParam) {
						if ($scope.selectedGroup.group === 'R-3 Residential, one- and two-family') {
							//$scope.buildingPermitFee =  $scope.percents.buildingPermit.r3 * $scope.valuation;
							$scope.buildingPermitFee = $scope.valuation * 0.00261692324298379 * 0.888226389234951;
						} else {
							var i = 0;
							var tier = null;
							for (; i < valuationTiers.length; i++) {
								tier = valuationTiers[i];
								if (($scope.valuation > tier.min && $scope.valuation < tier.max) || !tier.max) {
									if (i === 0) {
										$scope.buildingPermitFee = ($scope.valuation/1000) * tier.costper;
									} else {
										$scope.buildingPermitFee = ((($scope.valuation - valuationTiers[i - 1]['max'])/1000) * tier.costper) + valuationTiers[i - 1]['cumulative'];
									}
									break;
								}

							}
							// if ($scope.valuation > 0 && $scope.valuation <= 150000) {
							// 	costPer = getCostPer1000(1);
							// 	cumulative = (150000/1000) * costPer;
							// 	$scope.buildingPermitFee = ($scope.valuation/1000) * costPer;
							// } else if ($scope.valuation > 150001 && $scope.valuation <= 250000) {
							// 	costPer = getCostPer1000(0.95);
							// 	cumulative = (((250000 - 150000)/1000) * costPer) + ;
							// 	$scope.buildingPermitFee = ((($scope.valuation - 150000)/1000) * costPer) + 116.71;
							// } else if ($scope.valuation > 250001 && $scope.valuation <= 500000) {
							// 	costPer = getCostPer1000(0.92);
							// 	$scope.buildingPermitFee = ((($scope.valuation - 250000)/1000) * costPer) + 190.62;
							// } else if ($scope.valuation > 500001 && $scope.valuation <= 750000) {
							// 	costPer = getCostPer1000(0.90);
							// 	$scope.buildingPermitFee = ((($scope.valuation - 500000)/1000) * costPer) + 369.58;
							// } else if ($scope.valuation > 750001 && $scope.valuation <= 1000000) {
							// 	costPer = getCostPer1000(0.88);
							// 	$scope.buildingPermitFee = ((($scope.valuation - 750000)/1000) * costPer) + 544.64;
							// } else if ($scope.valuation > 1000001 && $scope.valuation <= 5000000) {
							// 	costPer = getCostPer1000(0.80);
							// 	$scope.buildingPermitFee = ((($scope.valuation - 750000)/1000) * costPer) + 715.81;
							// } else if ($scope.valuation > 5000001 && $scope.valuation <= 15000000) {
							// 	costPer = getCostPer1000(0.70);
							// 	$scope.buildingPermitFee = ((($scope.valuation - 750000)/1000) * costPer) +  3205.58 ;
							// } else if ($scope.valuation > 15000001 && $scope.valuation <= 25000000) {
							// 	costPer = getCostPer1000(0.60);
							// 	$scope.buildingPermitFee = ((($scope.valuation - 15000000)/1000) * costPer) +  8651.95 ;
							// } else if ($scope.valuation > 25000000) {
							// 	costPer = getCostPer1000(0.50);
							// 	$scope.buildingPermitFee = ((($scope.valuation - 25000000)/1000) * costPer) +  13320.27 ;
							// }
						}
					}
					else {
						$scope.buildingPermitFee = 0;
					}
					// if ($scope.selectedGroup && $scope.selectedParam) {
					// 	var percent = ($scope.selectedGroup.group === 'R-3 Residential, one- and two-family') ? $scope.percents.buildingPermit.r3 : $scope.percents.buildingPermit.all;
					// 	$scope.buildingPermitFee =  percent * $scope.valuation;
					// } else {
					// 	$scope.buildingPermitFee = 0;
					// }

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

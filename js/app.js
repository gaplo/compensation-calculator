var app = angular.module('compensation', ['ngLodash','nvd3']);

app.constant('config', {
  'INSURANCE_CR_FACTOR': 0.041544, // Insurance credit factor 0.041544
  'INSURANCE_STD_CR': 10803.00, // Standard credit per audlt 10803.00
  'INSURANCE_CHILD_CR': 10254.00, // Credit per child 10254.00
  'INSURANCE_HS_CR': 3800.00, // Health screening allowance 3800.00
  'ORSO_EMPLOYER_CON_MIN': 10.00, // ORSO - Employer min contribution 10.00%
  'ORSO_EMPLOYER_CON_MAX': 12.50, // ORSO - Employer max contribution 12.50%
  'STATUTORY_MAX': 22500.00, // Termination payment - max monthly wages
  'STATUTORY_FACTOR': 2 / 3, // Termination payment - Statutory Payment amount factor
  'SEVERANCE_MAX_YEAR': 12 // Termination payment - max severance years is 12
});

app.controller('CalcCtrl', ['$scope', 'lodash', 'config',
  function($scope, lodash, config) {

    // initialize
    $scope.base = 0.00;
    $scope.orsoEmployee = 0.00;
    $scope.mpfEmployer = 5.00;
    $scope.mpfEmployerCap = 18000.00;
    $scope.workingDay = 240;
    $scope.meal = 0.00;
    $scope.bonus = 0.00;
    $scope.leave = 0;
    $scope.children = 0;

    $scope.getMonthlyWages = function() {
      return lodash.ceil($scope.base / 12, 0);
    }

    $scope.getMpf = function() {
      return lodash.min([$scope.mpfEmployerCap, $scope.base * ($scope.mpfEmployer / 100.00)]);
    };

    $scope.getInsurance = function() {
      return lodash.round($scope.base / 12 * config.INSURANCE_CR_FACTOR, 2);
    };

    $scope.getStdInsurance = function() {
      return config.INSURANCE_STD_CR;
    };

    $scope.getSpouseInsurance = function() {
      return $scope.spouse ? config.INSURANCE_STD_CR : 0.00;
    };

    $scope.getChildrenInsurance = function() {
      return $scope.children * config.INSURANCE_CHILD_CR;
    };

    $scope.getHealthScreeningValue = function() {
      return config.INSURANCE_HS_CR;
    };

    $scope.getInsuranceTotal = function() {
      return $scope.getInsurance() + $scope.getStdInsurance() + $scope.getSpouseInsurance() + $scope.getChildrenInsurance() + $scope.getHealthScreeningValue();
    };

    $scope.getOrsoEmplrPercent = function() {
      return lodash.min([config.ORSO_EMPLOYER_CON_MIN + ($scope.orsoEmployee / 2), config.ORSO_EMPLOYER_CON_MAX]);
    };

    $scope.getOrsoEmplr = function() {
      return lodash.round($scope.getOrsoEmplrPercent() / 100.00 * $scope.base, 2);
    };

    $scope.getOrsoMpfDiff = function() {
      return $scope.getOrsoEmplr() - $scope.getMpf();
    };

    $scope.getDailyRate = function() {
      return lodash.round($scope.base / $scope.workingDay, 2);
    };

    $scope.getAnnualLeaveValuePerYear = function() {
      return lodash.round($scope.getDailyRate() * $scope.leave, 2);
    };

    $scope.getTotal = function() {
      return $scope.base + $scope.getOrsoMpfDiff() + $scope.meal + $scope.bonus + $scope.getInsuranceTotal() + $scope.getAnnualLeaveValuePerYear();
    };

    $scope.getBreakEvenPercent = function() {
      return lodash.round(($scope.getTotal() / $scope.base - 1) * 100, 2);
    };

    $scope.getDirConYear = function() {
      return $scope.dirConYear + lodash.round($scope.dirConMonth / 12, 2);
    };

    $scope.getPermYear = function() {
      return $scope.permYear + lodash.round($scope.permMonth / 12, 2);
    }

    $scope.getStatutory = function() {
      return lodash.round(lodash.min([config.STATUTORY_MAX, $scope.getMonthlyWages()]) * config.STATUTORY_FACTOR * ($scope.getDirConYear() + $scope.getPermYear()), 2);
    };

    $scope.getSeverance = function() {
      var permYear = lodash.min([config.SEVERANCE_MAX_YEAR, $scope.getPermYear()]);
      return lodash.round(permYear * $scope.getMonthlyWages() + $scope.getDirConYear() * lodash.min([config.STATUTORY_MAX, $scope.getMonthlyWages()]) * config.STATUTORY_FACTOR - $scope.getStatutory(), 2);
    };

    $scope.getTotalTermPay = function() {
      return $scope.getStatutory() + $scope.getSeverance();
    };

    $scope.getTotalAnnualComp = function() {
      return $scope.base + $scope.bonus;
    };

    $scope.getRegularTermsBreakEven = function() {
      return lodash.round(($scope.getTotalAnnualComp() / $scope.base - 1) * 100, 2);
    };

	$scope.options = {
            chart: {
                type: 'pieChart',
                height: 450,
                donut: true,
                x: function(d){return d.key;},
                y: function(d){return d.y;},
                showLabels: true,

                pie: {
                    startAngle: function(d) { return d.startAngle/2 -Math.PI/2 },
                    endAngle: function(d) { return d.endAngle/2 -Math.PI/2 }
                },
                duration: 500,
                legend: {
                    margin: {
                        top: 5,
                        right: 140,
                        bottom: 5,
                        left: 0
                    }
                }
            }
        };

		$scope.data = [{ values: [], key: 'Random Walk' }];

		setInterval(function() {
        $scope.data = [
            {
                key: "Base",
                y: lodash.round(($scope.base / $scope.getTotal()) * 100.00, 2)
            },
            {
                key: "ORSO-MPF Diff",
                y: lodash.round(($scope.getOrsoMpfDiff() / $scope.getTotal()) * 100.00, 2)
            },
            {
                key: "Meal",
                y: lodash.round(($scope.meal / $scope.getTotal()) * 100.00, 2)
            },
            {
                key: "Bonus",
                y: lodash.round(($scope.bonus / $scope.getTotal()) * 100.00, 2)
            },
            {
                key: "Insurance",
                y: lodash.round(($scope.getInsuranceTotal() / $scope.getTotal()) * 100.00, 2)
            },
            {
                key: "Annual Leave",
                y: lodash.round(($scope.getAnnualLeaveValuePerYear() / $scope.getTotal()) * 100.00, 2)
            }
        ];
		$scope.$apply();
		}, 500);


  }
]);

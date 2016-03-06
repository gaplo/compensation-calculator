var app = angular.module('compensation', []);

app.constant('config', {
  'INSURANCE_CR_FACTOR': 0.041544, // Insurance credit factor 0.041544
  'INSURANCE_STD_CR': 10107.00, // Standard credit per audlt 10107.00
  'INSURANCE_CHILD_CR': 9648.00, // Credit per child 9648.00
  'INSURANCE_HS_CR': 3800.00, // Health screening allowance 3800.00
  'ORSO_EMPLOYER_CON_MIN': 10.00, // ORSO - Employer min contribution 10.00%
  'ORSO_EMPLOYER_CON_MAX': 12.50, // ORSO - Employer max contribution 12.50%
  'STATUTORY_MAX': 22500.00, // Termination payment - max monthly wages
  'STATUTORY_FACTOR': 2 / 3, // Termination payment - Statutory Payment amount factor
  'SEVERANCE_MAX_YEAR': 12 // Termination payment - max severance years is 12
});

app.controller('CalcCtrl', ['$scope', '$window', 'config',
  function($scope, $window, config) {
    $scope.Math = $window.Math;
    $scope._ = $window._;

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
      return _.ceil($scope.base / 12, 0);
    }

    $scope.getMpf = function() {
      return _.min([$scope.mpfEmployerCap, $scope.base * ($scope.mpfEmployer / 100.00)]);
    };

    $scope.getInsurance = function() {
      return _.round($scope.base / 12 * config.INSURANCE_CR_FACTOR, 2);
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
      return _.min([config.ORSO_EMPLOYER_CON_MIN + ($scope.orsoEmployee / 2), config.ORSO_EMPLOYER_CON_MAX]);
    };

    $scope.getOrsoEmplr = function() {
      return _.round($scope.getOrsoEmplrPercent() / 100.00 * $scope.base, 2);
    };

    $scope.getOrsoMpfDiff = function() {
      return $scope.getOrsoEmplr() - $scope.getMpf();
    };

    $scope.getDailyRate = function() {
      return _.round($scope.base / $scope.workingDay, 2);
    };

    $scope.getAnnualLeaveValuePerYear = function() {
      return _.round($scope.getDailyRate() * $scope.leave, 2);
    };

    $scope.getTotal = function() {
      return $scope.base + $scope.getOrsoMpfDiff() + $scope.meal + $scope.bonus + $scope.getInsuranceTotal() + $scope.getAnnualLeaveValuePerYear();
    };

    $scope.getBreakEvenPercent = function() {
      return _.round(($scope.getTotal() / $scope.base - 1) * 100, 2);
    };

    $scope.getDirConYear = function() {
      return $scope.dirConYear + _.round($scope.dirConMonth / 12, 2);
    };

    $scope.getPermYear = function() {
      return $scope.permYear + _.round($scope.permMonth / 12, 2);
    }

    $scope.getStatutory = function() {
      return _.round(_.min([config.STATUTORY_MAX, $scope.getMonthlyWages()]) * config.STATUTORY_FACTOR * ($scope.getDirConYear() + $scope.getPermYear()), 2);
    };

    $scope.getSeverance = function() {
      var permYear = _.min([config.SEVERANCE_MAX_YEAR, $scope.getPermYear()]);
      return _.round(permYear * $scope.getMonthlyWages() + $scope.getDirConYear() * _.min([config.STATUTORY_MAX, $scope.getMonthlyWages()]) * config.STATUTORY_FACTOR - $scope.getStatutory(), 2);
    };

    $scope.getTotalTermPay = function() {
      return $scope.getStatutory() + $scope.getSeverance();
    }
  }
]);

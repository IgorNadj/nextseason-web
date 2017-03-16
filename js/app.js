"use strict";

(function(){
angular
	.module('nextseason', [])
	.controller('upcoming', ['$scope', '$http', function($scope, $http){
		$scope.shows = [];
		$http({ url: DATA_URL }).then(function(response){
			$scope.exportTime = moment.unix(response.data.exportTime).format('MMMM Do YYYY, h:mm:ss a');
			var shows = response.data.shows;
			for (var i in shows) {
				var show = shows[i];
				var d = moment.unix(show.earliest_release_date_timestamp);
				var now = moment();
				if (d.diff(now) < 0) {
					// already released
					continue;
				}
				show.earliestReleaseDateAbsoluteString = d.format("MMMM Do YYYY");
				show.earliestReleaseDateRelativeString = d.fromNow();
				if (show.earliestReleaseDateRelativeString.indexOf('in ') === 0) {
					// strip "in", so we can style differetly
					show.earliestReleaseDateRelativeString = show.earliestReleaseDateRelativeString.replace('in ', '');
				}
				var returnsSoonLimit = moment().add(2, 'days');
				show.returnsSoon = returnsSoonLimit.diff(d) > 0;
			}
			$scope.shows = shows;
		});
	}])
})();

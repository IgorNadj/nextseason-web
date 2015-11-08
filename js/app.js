"use strict";

(function(){
angular
	.module('nextseason', [])
	.service('api', ['$http', function($http){
		var apiUrl = API_URL;
		return function(action, params){
			return $http({
				url: apiUrl + '/' + action,
				params: params
			});
		}
	}])
	.controller('upcoming', ['$scope', 'api', function($scope, api){
		var GET_COUNT = 10;
		$scope.rows = {
			all: [],
			popular: [],
			faves: []
		};
		$scope.view = 'popular';
		$scope.gotAll = {
			all: false,
			popular: false,
			faves: false
		};
		$scope.loading = {
			all: false,
			popular: false,
			faves: false
		};
		$scope.orderViewBy = {
			all: null,     // server sort
			popular: null, // server sort
			faves: 'release_date_timestamp'
		};
		$scope.faveShowIds = {};
		$scope.faveShowIdsToLoad = [];
		$scope.faveShowNameToLoad = null;
		$scope.currentMessageRow = null;
		$scope.globalMessages = null;

		$scope.loadMore = function(view){
			if(!view){
				console.log('err: view required');
				return;
			}
			if($scope.gotAll[view]) return;
			if($scope.loading[view]) return;
			$scope.loading[view] = true;
			var url;
			var params;
			if(view == 'faves'){
				if($scope.faveShowIdsToLoad.length === 0){
					// nothing in the queue
					$scope.loading[view] = false;
					return;
				}
				var id = $scope.faveShowIdsToLoad.pop();
				if($scope.faveShowIds[id] !== undefined){
					// already got this one, try next
					$scope.loading[view] = false;
					$scope.loadMore('faves');
					return;
				}
				url = 'show';
				params = { 
					id: id
				};
			}else{
				url = 'shows/returning/'+view;
				var start = $scope.rows[view].length;
				params = { 
					start: start, 
					limit: GET_COUNT 
				};
			}
			api(url, params)
			.then(function(response){
				for(var i in response.data){
					var row = response.data[i];
					row.thumb_url = null;
					if(row.tmdb_poster_path){
						row.thumb_url = '//image.tmdb.org/t/p/w185' + row.tmdb_poster_path; 
					}else{
						row.thumb_url = 'theme/img/missing-poster.jpg';
					}
					row.tmdb_link = null;
					if(row.tmdb_id){
						row.tmdb_link = 'https://www.themoviedb.org/tv/' + row.tmdb_id; 
					}
					$scope.rows[view].push(row);
				};
				if(response.data.length == 0){
					if(view == 'faves'){
						// faves, special case
						$scope.setGlobalMessage({ noUpcomingSeasons: true });
						$scope.faveShowIds[params.id] = false; // so we don't try loading again
					}else{
						// we're at the end
						$scope.gotAll[view] = true;
					}
				}else{
					if(view == 'faves'){
						// faves
						$scope.faveShowIds[params.id] = true;	
						$scope.saveFaves();
						if($scope.view == 'faves'){
							// probably searched for this one, show some feedback near search bar
							if($scope.faveShowNameToLoad){
								$scope.setGlobalMessage({ loadedFave: true });	
							}
						}
					}
				}
				$scope.loading[view] = false;
				if(view == 'faves') $scope.loadMore('faves'); // in case we have multiple ids, try next
			});
		};
		$scope.$watch('view', function(){
			$scope.clearMessages();
			// clear other views 
			// - data not needed really as loading is fast
			// - and, switching back to a view is slow if lots of rows loaded
			if($scope.view != 'popular') $scope.rows.popular = [];
			if($scope.view != 'all') $scope.rows.all = [];
			$scope.loadMore($scope.view);
		});
		$scope.saveFaves = function(){
			var arr = [];
			for(var i in $scope.faveShowIds){
				if($scope.faveShowIds[i] === false) continue;
				arr.push(i);
			}
			if(arr.length === 0){
				if(window.history && window.history.pushState){ 
				    window.history.pushState('', '', window.location.pathname); // no jump to top 
				}else{
					window.location.hash = '';	
				}
			}else{
				window.location.hash = arr.join(',');
			}
		};
		$scope.goToFaves = function(){
			$scope.view = 'faves';
		};
		$scope.addShowToFaves = function(row){
			$scope.faveShowIdsToLoad.push(row.show_id);
			$scope.loadMore('faves');
			$scope.setRowMessage(row, { addedToFaves: true });
		};

		$scope.removeShowFromFaves = function(row){
			// remove from faves array
			delete $scope.faveShowIds[row.show_id];
			// remove rows from faves view
			// we modify in place so iterate in revers
			var i = $scope.rows.faves.length;
			while(i--){
				if($scope.rows.faves[i].show_id == row.show_id){
					$scope.rows.faves.splice(i, 1);
				}
			}
			$scope.saveFaves();
			$scope.setRowMessage(row, { removedFromFaves: true });
		};
		$scope.setRowMessage = function(row, messageObj){
			$scope.clearMessages();
			row.messages = messageObj;
			$scope.currentMessageRow = row;
		};
		$scope.setGlobalMessage = function(messageObj){
			$scope.clearMessages();
			$scope.globalMessages = messageObj;
		};
		$scope.clearMessages = function(){
			// remove old msg from whichever row it's on
			if($scope.currentMessageRow){
				$scope.currentMessageRow.messages = null; 
			}
			$scope.currentMessageRow = null;
			$scope.globalMessages = null;
		};
		$scope.scrolledToBottom = function(){
			$scope.loadMore($scope.view);
		};
		$scope.searchFormSubmit = function(e){
			var field = $(e.target).find('input');
			field.focus().select();
			if(field.hasClass('ui-autocomplete-input')) field.autocomplete('search');
		};
		$scope.init = function(){
			if(window.location.hash){
				$scope.view = 'faves';
				var ids = window.location.hash.replace('#','').split(',');
				for(var i in ids){
					$scope.faveShowIdsToLoad.push(ids[i]);
				}
			}
			$scope.loadMore($scope.view);
		};
		$scope.init();
	}])
	.directive('autocompleteShows', ['api', function(api){
		return function(scope, elm, attr){
        	elm.autocomplete({
        		source: function(request, response){
        			api('shows/autocomplete', { q: request.term })
        			.then(function(apiResponse){
        				var r = [];
        				for(var i in apiResponse.data){
        					r.push({ value: apiResponse.data[i].id, label: apiResponse.data[i].name });
        				}
        				response(r);
        			});
        		},
				focus: function( event, ui ) {
					elm.val(ui.item.label);
					return false;
				},
				select: function(event, ui){
					scope.$apply(function(){
						scope.view = 'faves';
						scope.faveShowIdsToLoad.push(ui.item.value);
						scope.faveShowNameToLoad = ui.item.label;
						scope.clearMessages();
						scope.loadMore('faves');
					});
					elm.val(ui.item.label);
					return false;
				}
        	});
        	elm.click(function(){ elm.select(); });
		}
	}])
	.directive('infiniteScroll', ['$document', function($document){
    	return function(scope, elm, attr){
        	var raw = elm[0];
        	$document.bind('scroll', function(){
        		var lowestPixelSeen = $('body').scrollTop() + window.innerHeight;
        		var lastElement = $(raw).children().last();
        		if(lastElement.size() > 0){
        			var lastElementOffset = lastElement.offset().top;
	            	if(lowestPixelSeen > lastElementOffset){
	                	scope.$apply(attr.infiniteScroll);
	            	}
        		}
        	});
    	};
	}])
	.directive('imageBackgroundColor', function(){
		return {
			link: function(scope, element, attrs){
				var imgEl = element.find('img').first()[0];
				if(!imgEl){
					return;
				}
				if(!window.colorThief) window.colorThief = new ColorThief();
				imgEl.crossOrigin = 'Anonymous';
				imgEl.onload = function(){
					try{
						var rgb = window.colorThief.getColor(imgEl);
						var rgbObj = { r: rgb[0], g: rgb[1], b: rgb[2] };
						var c = tinycolor(rgbObj);
						while(c.isDark()){
							c.lighten();
						}
						c.lighten().desaturate();
						element.css('background-color', c.toString());
					}catch(e){
						console.log(e);
					}
				};
			}
		}
	});
	
})();

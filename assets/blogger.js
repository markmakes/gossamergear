/*!
 * UDUNDI BLOGGER APP
 */
var udundiBlogger = angular.module('udundiBlogger', ['wu.masonry', 'ngSanitize']);

udundiBlogger.config(function ($interpolateProvider) {
  $interpolateProvider.startSymbol('{[').endSymbol(']}');
});

udundiBlogger.controller('BloggerController', ['$rootScope', '$document', '$scope', '$http', '$controller', '$location', function ($rootScope, $document, $scope, $http, $controller, $location) {
  
  var currentHash = $location.path().replace(/\//g, '');
  var articleUrl = "//udundi-filtering-test.herokuapp.com/get_article?shop_id=wxyz-jewelry&blog_id=29324421&article_handle="+currentHash;
  var articlesUrl = "//udundi-filtering-test.herokuapp.com/get_articles?shop_id=wxyz-jewelry&blog_id=29324421";
  // var articlesUrl = "//udundi-filtering-test.herokuapp.com/get_articles?shop_id=wxyz-jewelry&blog_id=29324421";

  $scope.articlesArr = [];

  $scope.flatten = function() {
    $scope.articles = _.flatten($scope.articlesArr);
    console.log($scope.articles);
  };

  if (currentHash) {
    $http.get(articleUrl).success(function(data) {
      $scope.articlesArr.push(data.articles);
      $scope.flatten();
      setTimeout(function() {
        var currentItem = $document.find('#' + currentHash);
        currentItem.addClass('mega');
      });
    });
  }

  var initCount = Math.abs((Math.floor(articlesCount/20)*20)-articlesCount);
  var initPage = Math.ceil(articlesCount/20);
  $http.get(articlesUrl+"&limit=20&page="+initPage).success(function(data) {
    $scope.articlesArr.push(data.articles.reverse());
    $scope.flatten();
  });
  
  var nextCount = articlesCount-initCount;
  var nextPage = Math.ceil(nextCount/40);
  (function getArticles(i) {
    setTimeout(function() {
      $http.get(articlesUrl+"&limit=40&page="+i).success(function(data) {
        $scope.articlesArr.push(data.articles.reverse());
        $scope.flatten();
      });
      if (--i) getArticles(i);
    }, 500);
  })(nextPage);
  
  $scope.animateIn = function($el) {
    $el.removeClass('ud-hidden');
    $el.addClass('ud-fade-in-up');
  };
  
  $scope.animateOut = function($el) {
    $el.addClass('ud-hidden');
    $el.removeClass('ud-fade-in-up');
  };

  $scope.articleOrder = '-published_at';

  var handler = function(e){
    if(e.keyCode === 39) {
      console.log('right arrow');
      $scope.nextItem();
    }
    else if(e.keyCode === 37) {
      console.log('right arrow');
      $scope.prevItem();
    }
  };

  var $doc = angular.element(document);
  $doc.on('keydown', handler);
  $scope.$on('$destroy',function(){
    $doc.off('keydown', handler);
  });

}]);

udundiBlogger.directive('udRelatedProducts', ['$document', '$location', function ($document, $location) {
  return {
    restrict: 'A',
    replace: true,
    scope: true,
    template: '<div id="{[ article.handle ]}" class="ud-grid-related-products">' +
      '<div masonry preserve-order reload-on-show reload-on-resize class="masonry" column-width=".ud-grid-product-sizer" percent-position="true" item-selector=".ud-grid-product">' +
      '<div class="ud-grid-product-sizer"></div>' +
      '<div masonry-brick class="ud-grid-product ud-fade-in-left ud-delay-7ms" ng-repeat="product in related_products">' +
      '<a href="../../products/{[ product.handle ]}">' +
      '<div class="ud-product-wrapper">' +
      '<div class="ud-product-image">' +
      '<div class="ud-product-overlay ud-gradient hidden-sm hidden-xs"></div>' +
      '<img ng-src="{[ product.image.src ]}" alt="{[ product.title ]}" />' +
      '</div>' +
      '<div class="ud-product-details hidden-sm hidden-xs">' +
      '<p class="ud-product-title">{[ product.title ]}</p>' +
      '<p class="ud-product-price margin-bottom">{[ (product.variants[0].price) | currency ]}</p>' +
      '</div>' +
      '</div>' +
      '</a>' +
      '</div>' +
      '</div>' +
      '</div>',
    link: function(scope, element, attrs) {
      var watcher = scope.$watch('products', function() {
        if (_.isUndefined(scope.products)) return;
        scope.location = $location;
        scope.$watch('location.path()', function (currentPath) {
          var currentId = currentPath.replace('/', '');
          var currentItemId = (_.isUndefined($document.find('.ud-grid-item.mega')[0])) ? false : $document.find('.ud-grid-item.mega')[0].id;
          if (currentId === currentItemId) {
            var id = currentId;
            var currentArticle = _.find(scope.articles, {'handle': id});
            var tags = currentArticle.tags;
            if (!_.isUndefined(tags)) {
              var product_tags = [];
              _.each(tags, function(tag, value) {
                var product = tag.match(/product_([^,]+)/);
                if (product) {
                  product_tags.push({'product': tag.replace('product_', '').replace(/\s/g, '-').toLowerCase()});
                }
              });
              var handles = {};
              _.each(product_tags, function(tag) {
                handles[tag.product] = true; 
              });
              scope.related_products = _.filter(scope.products, function(product) {
                return handles[product.handle];
              }, product_tags);
            }
          };
        });
        watcher();
      });
    }
  };
}]);

udundiBlogger.directive('udExpand', [ '$rootScope', '$document', '$location', function ($rootScope, $document, $location) {
  var doRelayout = _.debounce(function() { $rootScope.$broadcast('masonry.reload')}, 200);
  return {
    restrict: 'A',
    scope: false,
    link: function (scope, element, attrs) {
      scope.location = $location;

      element.bind('click', function(e) {
        var currentItem = $document.find('.ud-grid-item.mega');
        if(!_.isUndefined(currentItem)) {
          currentItem.removeClass('mega');
          doRelayout();
        }
        if($(this).hasClass('mega')) return;
        e.stopPropagation();
        element.addClass('mega');
        doRelayout();
        setTimeout(function() {
          $('body,html').animate({ scrollTop: element.offset().top - 100 }, 400);
          scope.$apply(function () {
            scope.location = $location.path(attrs['id']);
          });
        }, 600);
      });
    }
  };
}]);

udundiBlogger.directive('udCloseResize', [ '$rootScope', '$location', function ($rootScope, $location) {
  var doRelayout = _.debounce(function() { $rootScope.$broadcast('masonry.reload')});
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      element.on('click', function (e) {
        var currentItem = element.parent();
        var prevItem = (_.isUndefined(element.parent().prev())) ? element.parent() : element.parent().prev();
        currentItem.removeClass('mega');
        setTimeout(function () {
          scope.$apply(function () {
            scope.location = $location.path('');
          });
        }, 0);
        doRelayout();
        $('body,html').animate({ scrollTop: prevItem.offset().top - 80 }, 600);
        e.stopPropagation();
      });
    }
  }
}]);

udundiBlogger.directive('udPrevItem', ['$rootScope', '$document', '$location', function($rootScope, $document, $location){
  var doRelayout = _.debounce(function() { $rootScope.$broadcast('masonry.reload')});
  return {
    restrict: 'A',
    replace: false,
    link: function(scope, element, attrs) {
      
      $rootScope.prevItem = function() {
        var currentItem = $document.find('.ud-grid-item.mega');
        var prevItem = (_.isUndefined(currentItem.prev())) ? currentItem.next() : currentItem.prev();
        var prevId = prevItem[0].id;
        currentItem.removeClass('mega');
        prevItem.addClass('mega');
        doRelayout();
        setTimeout(function() {
          scope.$apply(function () {
            scope.location = $location.path(prevId);
          });
          $('body,html').animate({ scrollTop: prevItem.offset().top - 100 }, 400);
        }, 400);
      };

      element.on('click', function(e) {
        e.stopPropagation();
        scope.prevItem();
      });

    }
  }
}]);

udundiBlogger.directive('udNextItem', ['$rootScope', '$document', '$location', function($rootScope, $document, $location){
  var doRelayout = _.debounce(function() { $rootScope.$broadcast('masonry.reload')});
  return {
    restrict: 'A',
    replace: false,
    link: function(scope, element, attrs) {
      
      $rootScope.nextItem = function() {
        var currentItem = $document.find('.ud-grid-item.mega');
        var nextItem = (_.isUndefined(currentItem.next())) ? currentItem.prev() : currentItem.next();
        var nextId = nextItem[0].id;
        currentItem.removeClass('mega');
        nextItem.addClass('mega');
        doRelayout();
        setTimeout(function() {
          scope.$apply(function () {
            scope.location = $location.path(nextId);
          });
          $('body,html').animate({ scrollTop: nextItem.offset().top - 100 }, 400);
        }, 400);
      };

      element.on('click', function(e) {
        e.stopPropagation();
        scope.nextItem();
      });
    }
  }
}]);

udundiBlogger.directive('whenVisible', ['$document', '$window', function($document, $window) {

    var determineWhereElementIsInViewport =
      function($el, document, whenVisibleFn, whenNotVisibleFn, delayPercent, delayPercentViewport, delayPixels, scope) {

        var elementBounds = $el[0].getBoundingClientRect();
        var viewportHeight = document.clientHeight;

        var panelTop = elementBounds.top;
        var panelBottom = elementBounds.bottom;

        var delayPx; // pixel buffer until deciding to show the element
        var delayPxValues = [];
        if (delayPixels) {
          delayPxValues.push(delayPixels);
        }
        if (delayPercentViewport) {
          delayPxValues.push(delayPercentViewport * $window.innerHeight);
        }
        if (delayPercent) {
          delayPxValues.push(delayPercent * elementBounds.height);
        }

        if (delayPxValues.length === 0) {
          delayPx = 0.25 * elementBounds.height;
        }
        else {
          delayPx = Math.min.apply(Math, delayPxValues); //Show element as soon as any delay has been fulfilled
        }

        var bottomVisible = (panelBottom - delayPx > 0) && (panelBottom < viewportHeight);
        var topVisible = (panelTop + delayPx <= viewportHeight) && (panelTop > 0);

        if ($el.data('hidden') && (bottomVisible || topVisible)) {
          whenVisibleFn($el, scope);
          $el.data('hidden', false);
        }

        // scrolled out from scrolling down or up
        else if (!($el.data('hidden')) && (panelBottom < 0 || panelTop > viewportHeight)) {
          whenNotVisibleFn($el, scope);
          $el.data('hidden', true);
        }
      };

    return {
      restrict: 'A',
      scope: {
        whenVisible: '&',
        whenNotVisible: '&?',
        delayPercent: '=?',
        delayPercentViewport: '=?',
        delayPixels: '=?',
        bindScrollTo: '@?'
      },

      controller: ['$scope', function(scope) {
        if (!scope.whenVisible || !angular.isFunction(scope.whenVisible())) {
          throw new Error('Directive: angular-scroll-animate \'when-visible\' attribute must specify a function.');
        }

        if (scope.whenNotVisible && !angular.isFunction(scope.whenNotVisible())) {
          throw new Error('Directive: angular-scroll-animate \'when-not-visible\' attribute must specify a function.');
        }
        else if (!scope.whenNotVisible) {
          scope.whenNotVisible = function() {
            return angular.noop;
          };
        }

        if (scope.delayPercent) {

          var delayPercent = parseFloat(scope.delayPercent);

          if (!angular.isNumber(delayPercent) || (delayPercent < 0 || delayPercent > 1)) {
            throw new Error('Directive: angular-scroll-animate \'delay-percent\' attribute must be a decimal fraction between 0 and 1.');
          }
        }
    }],

      link: function(scope, el, attributes) {

        var delayPercent = attributes.delayPercent; //Fallback is be 0.25% delayPercent if no delay is specified, set in determineWhereElementIsInViewport function
        var delayPercentViewport = attributes.delayPercentViewport;
        var delayPixels = attributes.delayPixels;
        var document = $document[0].documentElement;
        var checkPending = false;

        var updateVisibility = function() {
          determineWhereElementIsInViewport(el, document, scope.whenVisible(), scope.whenNotVisible(), delayPercent, delayPercentViewport, delayPixels, scope);

          checkPending = false;
        };

        var onScroll = function() {

          if (!checkPending) {
            checkPending = true;

            /* globals requestAnimationFrame */
            requestAnimationFrame(updateVisibility);
          }
        };

        var documentListenerEvents = 'scroll';

        /* allows overflow:auto on container element to animate for Safari browsers */
        if (attributes.bindScrollTo) {
          angular.element($document[0].querySelector(attributes.bindScrollTo)).on(documentListenerEvents, onScroll);
        }

        /* always bind to document scroll as well - works for overflow: auto on Chrome, Firefox browsers */
        $document.on(documentListenerEvents, onScroll);

        scope.$on('$destroy', function() {
          $document.off(documentListenerEvents, onScroll);
        });

        var $elWindow = angular.element($window);
        var windowListenerEvents = 'resize orientationchange';
        $elWindow.on(windowListenerEvents, onScroll);

        scope.$on('$destroy', function() {
          $elWindow.off(windowListenerEvents, onScroll);
        });

        // initialise
        el.data('hidden', true);
        scope.$evalAsync(onScroll);
      }
    };
}]);

// udundiBlogger.directive('udEndlessScroll', ['$window', function($window) {
//   return {
//     restrict: 'A',
//     link: function (scope, element, attrs) {
//       angular.element($window).bind('scroll', function() {
//         var windowHeight = "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;
//         var body = document.body, html = document.documentElement;
//         var docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight,  html.scrollHeight, html.offsetHeight);
//         windowBottom = (windowHeight + window.pageYOffset);
//         if (windowBottom >= docHeight) {
//           scope.$apply(function () { scope.articlesLimit += 5; });
//         }
//       });
//     }
//   }
// }]);
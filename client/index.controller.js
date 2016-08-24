'use strict'

var app=angular.module("app", ["chart.js"])

app.factory('yahooStock', ['$http',function($http) {
    return (startDate,endDate,companys,callback)=>{
      let url = 'https://query.yahooapis.com/v1/public/yql'
          ,data = encodeURIComponent(
              'select * from yahoo.finance.historicaldata where symbol in ("'
              + companys.join('","') +'") and startDate = "' + startDate 
              + '" and endDate = "' + endDate + '"'
              );
  
       $http.get(url+'?q=' + data + "&env=http%3A%2F%2Fdatatables.org%2Falltables.env&format=json")
       .then((result)=>{ callback(result)});
    };
}]);


app.controller("LineCtrl", ['$scope','yahooStock','$q',function ($scope,yahooStock,$q) {
 
  $scope.labels = [];
  $scope.data = [];
  $scope.series = ["YHOO","AAPL","GOOG","MSFT"];
  $scope.stock={historyDays:50};
  const oneDayMs=24*60*60*1000;
  var socket = io.connect();
  
   
  $scope.refresh=()=>{
    
    $scope.datasetOverride = $scope.series.map(()=>{return {tension:0,spanGaps:true}});
    
    let curTime=Date.now();
    let startDate=new Date(curTime-oneDayMs*$scope.stock.historyDays).toISOString().replace(/T.*$/,'');
    let endDate=new Date(curTime).toISOString().replace(/T.*$/,'');

    function fn(result){
        $q((resolve,reject) => resolve( $scope.data=$scope.series.map(()=>{
            return [];
        })))
        .then(()=>{
            //refresh labels
            $scope.labels=[];
            for(let i=curTime-oneDayMs*$scope.stock.historyDays; i<=curTime; i+=oneDayMs){
              $scope.labels.push(new Date(i).toISOString().replace(/T.*$/,''));
            }
            //refresh data
            let arr= result.data.query.results!==null? result.data.query.results.quote : [];
            arr.forEach((val)=>{
              $scope.data[$scope.series.indexOf(val.Symbol)][$scope.labels.indexOf(val.Date)]=(val.Close);
            });
        }); 
    }
    
    yahooStock(startDate,endDate,$scope.series,fn);
  } ;
  
  $scope.addCompany= (add)=>{
    $scope.series.push(add);
    socket.emit('message', $scope.series);
    //$scope.refresh();
  };
  
  $scope.deleteComany= (idx)=>{
    $scope.series.splice(idx,1);
    socket.emit('message', $scope.series);
    //$scope.refresh();
  };
  
  socket.on('connect', function () {
    //socket.emit('message', $scope.series);
  });
  
  socket.on('message', function (msg) {
    $scope.series=msg;
    $scope.refresh();
  });
  

}]);
  
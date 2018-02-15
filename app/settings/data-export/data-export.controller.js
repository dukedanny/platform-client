module.exports = [
    '$scope',
    '$rootScope',
    '$location',
    'DataExport',
    'Notify',
    'FormEndpoint',
    'FormAttributeEndpoint',
    '$q',
    '_',
    'LoadingProgress',
function (
    $scope,
    $rootScope,
    $location,
    DataExport,
    Notify,
    FormEndpoint,
    FormAttributeEndpoint,
    $q,
    _,
    LoadingProgress
) {
    $scope.exportAll = exportAll;
    $scope.showFields = false;
    $scope.showProgress = false;
    $scope.selectFields = selectFields;
    $scope.selectedFields = [];
    $scope.exportSelected = exportSelected;
    $scope.selectAll = selectAll;
    $scope.displayedForms = [];
    $scope.getForms = getForms;
    $scope.isLoading = LoadingProgress.getLoadingState;
    $scope.attachAttributes = attachAttributes;

    // hiding export-in-progress screen when export is complete
    $rootScope.$on('event:data_export:complete', function () {
        $scope.showProgress = false;
    });

    // Redirect to home if not authorized
    if ($rootScope.hasPermission('Bulk Data Import') === false) {
        return $location.path('/');
    }
    // Change layout class
    $rootScope.setLayout('layout-c');
    // Change mode
    $scope.$emit('event:mode:change', 'settings');

    function exportAll() {
        DataExport.prepareExport({format: 'csv'});
        $scope.showProgress = true;
    }

    function selectFields() {
        $scope.showFields = !$scope.showFields;
    }

    function getForms() {
        FormEndpoint.queryFresh().$promise.then(function (response) {
            $scope.forms = response;
            $scope.attachAttributes();
        });
    }
    function attachAttributes() {
        var attributeQueries = [];
        _.each($scope.forms, function (form) {
            attributeQueries.push(FormAttributeEndpoint.query({formId: form.id}));
        });
        $q.all(attributeQueries).then(function (results) {
            _.each(results, function (result, index) {
                /* TODO: I am not sure if we can do this, can I trust the results come in the same order
                so I can use the result index with the $scope.form[index]? Or do
                we need to go through form-stage-id? :scream: */
                $scope.forms[index].attributes = result;
            });
        });
    }

    function exportSelected() {
        var attributes = _.chain($scope.selectedFields)
            .flatten() // concatinating attributes into one array
            .compact() // removing nulls
            .value(); // output

        if (attributes.length === 0) {
            // displaying notification if no fields are selected
            var message =  '<p>Uh oh... you need to select some fields to export first.</p><div class="buttons-export"><button class="button">Got it</button></div>';
            Notify.notify(message, null, 'warning', 'error', false);
        } else {
            DataExport.prepareExport({attributes: attributes, format: 'csv'});
        }
    }

    function selectAll(form) {
        $scope.selectedFields[form.id] = !$scope.selectedFields[form.id] ? [] : $scope.selectedFields[form.id];
        if ($scope.selectedFields[form.id].length === form.attributes.length) {
            $scope.selectedFields[form.id] = [];
        } else {
            _.each(form.attributes, function (attribute) {
                if (!_.contains($scope.selectedFields[form.id], attribute.id)) {
                    $scope.selectedFields[form.id].push(attribute.id);
                }
            });
        }
    }

    getForms();
}];
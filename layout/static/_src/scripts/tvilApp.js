var tvilApp = {
    init: function () {
        console.log('init');
    },
    sayHi: function () {
        alert('Hi guys!');
    }
};

module.exports = window.tvilApp = tvilApp;

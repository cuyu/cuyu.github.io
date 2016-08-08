$(document).ready(function () {
    var moveDistance = "200px";
    var moveTime = 220;
    var jqueryObjects = $("#sidebar-checkbox");
    var toggle = jqueryObjects[0];
    jqueryObjects = jqueryObjects.add("#sidebar");
    jqueryObjects = jqueryObjects.add("div.wrap");
    var checked = false;
    $(document).click(function (e) {
        if (e.target === toggle) {
            checked = !checked;
            if (checked) {
                jqueryObjects.animate({
                    right: "+=" + moveDistance
                }, moveTime, function () {
                    // Animation complete.
                });
                toggle.style.background = "#103355";
                toggle.style.color = "white";
            }
            else {
                jqueryObjects.animate({
                    right: "-=" + moveDistance
                }, moveTime);
                toggle.style.background = "transparent";
                toggle.style.color = "#103355";
            }
        }
        else if(checked) {
            checked = !checked;
            jqueryObjects.animate({
                right: "-=" + moveDistance
            }, moveTime);
            toggle.style.background = "transparent";
            toggle.style.color = "#103355";
        }
    });
});
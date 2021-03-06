/*global rJS, RSVP, initGadgetMixin, loopEventListener */
(function(window, rJS, RSVP, initGadgetMixin, loopEventListener) {
    "use strict";
    function saveSpreadsheet(evt) {
        var gadget = this, editor_data, editor_gadget;
        return new RSVP.Queue().push(function() {
            // Prevent double click
            evt.target.getElementsByClassName("ui-btn")[0].disabled = true;
            return gadget.getDeclaredGadget("tableeditor");
        }).push(function(tablegadget) {
            editor_gadget = tablegadget;
            return editor_gadget.getData();
        }).push(function(data) {
            editor_data = data;
            // Always get a fresh version, to prevent deleting spreadsheet & co
            return gadget.aq_getAttachment({
                _id: gadget.props.jio_key,
                _attachment: "body.json"
            });
        }).push(function(body) {
            var data = JSON.parse(body);
            data.capacity_by_station_spreadsheet = JSON.parse(editor_data);
            return gadget.aq_putAttachment({
                _id: gadget.props.jio_key,
                _attachment: "body.json",
                _data: JSON.stringify(data, null, 2),
                _mimetype: "application/json"
            });
        }).push(function() {
            evt.target.getElementsByClassName("ui-btn")[0].disabled = false;
        });
    }
    function waitForSave(gadget) {
        return loopEventListener(gadget.props.element.getElementsByClassName("save_form")[0], "submit", false, saveSpreadsheet.bind(gadget));
    }
    var gadget_klass = rJS(window);
    initGadgetMixin(gadget_klass);
    gadget_klass.declareAcquiredMethod("aq_getAttachment", "jio_getAttachment").declareAcquiredMethod("aq_putAttachment", "jio_putAttachment").declareMethod("render", function(options) {
        var jio_key = options.id, gadget = this;
        gadget.props.jio_key = jio_key;
        return new RSVP.Queue().push(function() {
            return RSVP.all([ gadget.aq_getAttachment({
                _id: jio_key,
                _attachment: "body.json"
            }), gadget.getDeclaredGadget("tableeditor") ]);
        }).push(function(result_list) {
            return result_list[1].render(JSON.stringify(JSON.parse(result_list[0]).capacity_by_station_spreadsheet), {
                minSpareCols: 1,
                minSpareRows: 1
            });
        });
    }).declareMethod("startService", function() {
        var gadget = this;
        return this.getDeclaredGadget("tableeditor").push(function(tableeditor) {
            return RSVP.all([ tableeditor.startService(), waitForSave(gadget) ]);
        });
    });
})(window, rJS, RSVP, initGadgetMixin, loopEventListener);
/*global rJS, RSVP, jQuery, gantt,
         initGadgetMixin, console */
/*jslint nomen: true, unparam: true */
(function (window, rJS, RSVP, $, gantt,
           initGadgetMixin) {
  "use strict";

  gantt.templates.task_class = function (start, end, obj) {
    return obj.parent ? "sub_task" : "";
  };

  function gantt_widget(all_data, gadget) {
  // XXX: use dhx_gantt zoom level feature (
  // http://dhtmlx.com/docs/products/dhtmlxGantt/02_features.html )

    var now = new Date(),
      start_date = all_data.general.currentDate,
      input_data = all_data.input,
      graph_data = all_data.graph,
      output_data = all_data.result.result_list[gadget.props.result],
      config = all_data
              .application_configuration.output[gadget.props.action]
              .configuration,
      gantt_data;
    // temporary hack
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);

    if ((start_date !== undefined) && (start_date !== "")) {
      start_date = new Date(start_date);
    } else {
      start_date = new Date(now.getTime());
    }

    gantt_data = {
        data: [
          {
            id: "by_operator",
            text: "By Operator",
            start_date: start_date,
            duration: 0,
            project: 1,
            open: true
          },
          {
            id: "by_station",
            text: "By Station",
            start_date: start_date,
            duration: 0,
            project: 1,
            open: true
          }
        ],
        link: []
      };
    console.log("gantt gadget method");
    console.log(config);
    console.log(input_data);
    console.log(graph_data);
    console.log(output_data);

    function isVisibleStation(station) {
      var i;
      // we should be able to define in the backend which
      // station is visible
      for (i = 0; i <= output_data.elementList.length-1; i += 1) {
        if (output_data.elementList[i].id === station) {
          return (output_data.elementList[i].family !== 'Buffer' &&
                  output_data.elementList[i].family !== 'Exit' &&
                  output_data.elementList[i].family !== 'Operator' &&
                  output_data.elementList[i].family !== 'Entry');
        }
      }
    }

    $.each(
      output_data.elementList.sort(function (a, b) {
        return a.id < b.id ? -1 : 1;
      }),
      function (idx, obj) {
        var duration = 0;

        if (obj.family === 'Operator') {

          gantt_data.data.push({
            id: obj.id,
            text: obj.id,
            project: 1,
            open: false,
            parent: "by_operator"
          });

          console.log("operator");
          console.log(obj.id);
          if (obj.results.schedule) {

            $.each(obj.results.schedule, function (i, schedule) {
              var task_start_date;

              // Filter intermediate steps in part job shop
              if (isVisibleStation(schedule.stationId)) {

                if (schedule.exitTime) {
                  duration = 24 * (schedule.exitTime - schedule.entranceTime);
                } else {
                  if (obj.results.schedule[i + 1]) {
                    duration = obj.results.schedule[i + 1].entranceTime -
                               schedule.entranceTime;
                  } else {
                    // XXX completion time not provided
                    duration = obj.results.completionTime -
                      schedule.entranceTime;
                  }
                }
                if (duration > 0.0) {
                  console.log("..");
                  console.log("step");
                  console.log(i);
                  console.log("duration");
                  console.log(duration);
                  task_start_date = new Date(start_date.getTime());

                  // for simulation time unit as days
                  // task_start_date.setDate(task_start_date.getDate() +
                  //   schedule['entranceTime']);
                  // for simulation time unit as days hours
                  task_start_date.setTime(task_start_date.getTime() +
                                    schedule.entranceTime * 1000 * 60);

                  console.log("start date");
                  console.log(task_start_date);
                  console.log(schedule.entranceTime);
                  console.log(schedule.entranceTime * 1000 * 60);
                  gantt_data.data.push({
                    id: obj.id + '.' + schedule.stationId + '.' + i,
                    text: schedule.stationId,
                    start_date: task_start_date,
                    duration: duration,
                    parent: obj.id
                  });
                  gantt_data.data.push({
                    id: 'operator.' + obj.id + '.' + idx + '_' + i,
                    text: obj.id + "-" + schedule.stationId,
                    start_date: task_start_date,
                    duration: duration,
                    parent: schedule.stationId,
                    by_station: 1
                  });
                }
              }
            });

          }
        } else {
          if (isVisibleStation(obj.id)) {
            gantt_data.data.push({
              id: obj.id,
              text: obj.id,
              project: 1,
              open: false,
              parent: "by_station"
            });
          }
        }
      }
    );

//     gantt_output_height = 35 * (gantt_data.data.length + 1) + 1;
    gantt_data.data.sort(function (a, b) {
      // sort gantt data in a chronological order
      var result;
      if (a.start_date === undefined && b.start_date !== undefined) {
        result = 1;
      } else if (a.start_date !== undefined && b.start_date === undefined) {
        result = -1;
      } else if (a.start_date === undefined && b.start_date === undefined) {
        result = 0;
      } else if (a.start_date > b.start_date) {
        result = 1;
      } else if (a.start_date < b.start_date) {
        result = -1;
      } else {
        result = 0;
      }
      return result;
    });

    console.log("Returning the Gantt Data");
    console.log(gantt_data);
    return gantt_data;
  }

  var gadget_klass = rJS(window);
  initGadgetMixin(gadget_klass);
  gadget_klass
    /////////////////////////////////////////////////////////////////
    // Acquired methods
    /////////////////////////////////////////////////////////////////
    .declareAcquiredMethod("aq_getAttachment", "jio_getAttachment")

    /////////////////////////////////////////////////////////////////
    // declared methods
    /////////////////////////////////////////////////////////////////
    .declareMethod("render", function (options) {
      var jio_key = options.id,
        gadget = this;
      gadget.props.jio_key = jio_key;
      gadget.props.result = options.result;
      gadget.props.action_definition = options.action_definition;

      return gadget.aq_getAttachment({
          "_id": gadget.props.jio_key,
          "_attachment": "body.json"
        })
        .push(function (simulation_json) {
          var json_data = JSON.parse(simulation_json);
          gadget.props.result = json_data.result.result_list[options.result].sample_gantt;
        });
    })
    .declareMethod("startService", function () {
      console.log('start', this.props.result);
      
      
      console.log(gantt);
      
var demo_tasks = {
	data:[
		{"id":1, "text":"Office itinerancy", "type":gantt.config.types.project, "order":"10", progress: 0.4, open: false},

		{"id":2, "text":"Office facing", "type":gantt.config.types.project, "start_date":"02-04-2013", "duration":"8", "order":"10", progress: 0.6, "parent":"1", open: true},
		{"id":3, "text":"Furniture installation", "type":gantt.config.types.project, "start_date":"11-04-2013", "duration":"8", "order":"20", "parent":"1", progress: 0.6, open: true},
		{"id":4, "text":"The employee relocation", "type":gantt.config.types.project, "start_date":"13-04-2013", "duration":"6", "order":"30", "parent":"1", progress: 0.5, open: true},

        {"id":5, "text":"Interior office", "start_date":"02-04-2013", "duration":"7", "order":"3", "parent":"2", progress: 0.6, open: true},
        {"id":6, "text":"Air conditioners check", "start_date":"03-04-2013", "duration":"7", "order":"3", "parent":"2", progress: 0.6, open: true},
        {"id":7, "text":"Workplaces preparation", "start_date":"11-04-2013", "duration":"8", "order":"3", "parent":"3", progress: 0.6, open: true},
        {"id":8, "text":"Preparing workplaces", "start_date":"14-04-2013", "duration":"5", "order":"3", "parent":"4", progress: 0.5, open: true},
        {"id":9, "text":"Workplaces importation", "start_date":"14-04-2013", "duration":"4", "order":"3", "parent":"4", progress: 0.5, open: true},
        {"id":10, "text":"Workplaces exportation", "start_date":"14-04-2013", "duration":"3", "order":"3", "parent":"4", progress: 0.5, open: true},

        {"id":11, "text":"Product launch", "type":gantt.config.types.project, "order":"5", progress: 0.6, open: true},

        {"id":12, "text":"Perform Initial testing", "start_date":"03-04-2013", "duration":"5", "order":"3", "parent":"11", progress: 1, open: true},
        {"id":13, "text":"Development", "type":gantt.config.types.project, "start_date":"02-04-2013", "duration":"7", "order":"3", "parent":"11", progress: 0.5, open: true},
        {"id":14, "text":"Analysis", "start_date":"02-04-2013", "duration":"6", "order":"3", "parent":"11", progress: 0.8, open: true},
        {"id":15, "text":"Design", "type":gantt.config.types.project, "start_date":"02-04-2013", "duration":"5", "order":"3", "parent":"11", progress: 0.2, open: false},
        {"id":16, "text":"Documentation creation", "start_date":"02-04-2013", "duration":"7", "order":"3", "parent":"11", progress: 0, open: true},

        {"id":17, "text":"Develop System", "start_date":"03-04-2013", "duration":"2", "order":"3", "parent":"13", progress: 1, open: true},

		{"id":25, "text":"Beta Release", "start_date":"06-04-2013", "order":"3","type":gantt.config.types.milestone, "parent":"13", progress: 0, open: true},

        {"id":18, "text":"Integrate System", "start_date":"08-04-2013", "duration":"2", "order":"3", "parent":"13", progress: 0.8, open: true},
        {"id":19, "text":"Test", "start_date":"10-04-2013", "duration":"4", "order":"3", "parent":"13", progress: 0.2, open: true},
        {"id":20, "text":"Marketing", "start_date":"10-04-2013", "duration":"4", "order":"3", "parent":"13", progress: 0, open: true},

        {"id":21, "text":"Design database", "start_date":"03-04-2013", "duration":"4", "order":"3", "parent":"15", progress: 0.5, open: true},
        {"id":22, "text":"Software design", "start_date":"03-04-2013", "duration":"4", "order":"3", "parent":"15", progress: 0.1, open: true},
        {"id":23, "text":"Interface setup", "start_date":"03-04-2013", "duration":"5", "order":"3", "parent":"15", progress: 0, open: true},
        {"id":24, "text":"Release v1.0", "start_date":"15-04-2013", "order":"3","type":gantt.config.types.milestone, "parent":"11", progress: 0, open: true}
	],
	links:[
		{id:"1",source:"1",target:"2",type:"1"},

		{id:"2",source:"2",target:"3",type:"0"},
		{id:"3",source:"3",target:"4",type:"0"},
		{id:"4",source:"2",target:"5",type:"2"},
		{id:"22",source:"13",target:"24",type:"0"}
	]
};

		gantt.templates.scale_cell_class = function(date){
		    if(date.getDay()==0||date.getDay()==6){
		        return "weekend";
		    }
		};
		gantt.templates.task_cell_class = function(item,date){
		    if(date.getDay()==0||date.getDay()==6){ 
		        return "weekend" ;
		    }
		};

		gantt.templates.rightside_text = function(start, end, task){
			if(task.type == gantt.config.types.milestone){
				return task.text;
			}
			return "";
		}

		gantt.config.columns = [
		    {name:"text",       label:"Task name",  width:"*", tree:true },
		    {name:"start_time",   label:"Start time",  template:function(obj){
				return gantt.templates.date_grid(obj.start_date);
		    }, align: "center", width:60 },
		    {name:"duration",   label:"Duration", align:"center", width:60}
		    
		];

/*
		gantt.config.grid_width = 390;
		gantt.config.date_grid = "%F %d"
		gantt.config.scale_height  = 60;
		gantt.config.subscales = [
			{ unit:"week", step:1, date:"Week #%W"}
		];
		
		http://docs.dhtmlx.com/gantt/desktop__configuring_time_scale.html#settingtheunitofthescale
		
		
*/
//		gantt.config.start_date = new Date(2013, 10, 4, 7, 00);
//		gantt.config.end_date = new Date(2013, 10, 4, 24, 00);
		gantt.config.date_grid = "%H:%i";
		gantt.config.scale_unit = "hour";
		gantt.config.step = 4;
		gantt.config.subscales = [
			{ unit:"day", step:1, date:"%F %d"}
		];
		//gantt.config.duration_unit = "hour";
		gantt.config.date_scale = "%H:%i";


    gantt.init($(this.props.element).find('.gant_container')[0]);
		//modSampleHeight();
		gantt.parse(demo_tasks);

//      $(this.props.element).find('.gant_container').dhx_gantt({
//        data: this.props.result,
//        readonly: true,
//        /* for days has simulation time unit
//        scale_unit: 'day',
//        step: 7
//        */
//          // for hours has simulation time unit
//        scale_unit: 'day',
//        duration_unit: 60 * 1000,
//          // date_grid: "%H:%i",
//        date_scale: "%M/%d",
//        step: 1,
//        subscales: [{unit: "hour", step: 1, date: "%H:%i"}]
//      });

      return new RSVP.Queue()
        .push(function () {
          // Infinite wait, until cancelled
          return (new RSVP.defer()).promise;
        })
        .push(undefined, function (error) {
          gantt.clearAll();
          throw error;
        });
    });
}(window, rJS, RSVP, jQuery, gantt, initGadgetMixin));

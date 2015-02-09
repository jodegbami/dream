from datetime import datetime
from pprint import pformat

from dream.plugins import plugin

class PrepareComponentGantt(plugin.OutputPreparationPlugin):

  def postprocess(self, data):
    """Post process the data for Gantt gadget
    Gantt expect data in the following format:
      
      data: [
          {
            id: "order_1", # an unique id
            text: "First Order", # the text to display
            start_date: start_date, # the date in ISO format
            duration: 100, # the duration in XXX seconds ?
            project: 1, # if this is true, this line will contains some other lines
            open: true # 
          },
          {
            id: "line_from_order_1",
            text: "An order line",
            start_date: start_date,
            duration: 100,
            parent: "order_1",    # id of the parent
            open: false
          }
        ],
      gantt_config :
        # Zoom level (day, month etc)
        # 
        
    """
    self.logger.info("%s: %s" % (self.configuration_dict, pformat(data)))
    result = data['result']['result_list'][-1]
    
    strptime = datetime.strptime
    # XXX this format is incorrect we need to include hour too
    now = strptime(data['general']['currentDate'], '%Y/%m/%d')

    self.logger.info("families: %s" % set([element.get('family') for element in result['elementList']]))
    jobs = {}
    gantt_data = [
    ]
    for job in [element for element in result['elementList'] if element.get('family') == 'Job']:
      self.logger.info("Job %s" % job)
      #assert job['id'] not in jobs, (pformat(job) + pformat(jobs[job['id']]))
      jobs[job['id']] = job
      gantt_data.append(job)
    result['sample_gantt'] = gantt_data
    return data

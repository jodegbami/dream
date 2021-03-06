'''
Created on 13 Jun 2014

@author: Panos
'''
#===========================================================================
# Copyright 2013 University of Limerick
#
# This file is part of DREAM.
#
# DREAM is free software: you can redistribute it and/or modify
# it under the terms of the GNU Lesser General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# DREAM is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Lesser General Public License for more details.
#
# You should have received a copy of the GNU Lesser General Public License
# along with DREAM.  If not, see <http://www.gnu.org/licenses/>.
# ===========================================================================

from ImportCSVdata import Import_CSV
from ConfidenceIntervals import Intervals

filename = ("DataSet.csv")
data=Import_CSV()   #call the Import_CSV module and using its method Input_data import the data set from the CSV file to the tool
Data = data.Input_data(filename)

ProcTime = Data.get('ProcessingTimes',[])       #get from the returned Python dictionary the three data sets
MTTF = Data.get('MTTF',[])
MTTR = Data.get('MTTR',[])

CI=Intervals()  #create a Intervals object
#print the confidence intervals of the data sets applying either 90% or 95% probability
print CI.ConfidIntervals(ProcTime, 0.95)
print CI.ConfidIntervals(MTTF, 0.90)
print CI.ConfidIntervals(MTTR, 0.95)
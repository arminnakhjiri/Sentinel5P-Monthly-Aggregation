// Sentinel-5P UVAI: Monthly Mean, Minimum, Maximum
// November 2025 - October 2026

var AOI = geometry;
Map.centerObject(AOI, 5);

var startDate = ee.Date('2025-11-01');
var numberOfMonths = 12;
var endDate = startDate.advance(numberOfMonths, 'month');

var UVAI = ee.ImageCollection('COPERNICUS/S5P/OFFL/L3_AER_AI')
  .filterBounds(AOI)
  .filterDate(startDate, endDate)
  .select('absorbing_aerosol_index');

print('UVAI ImageCollection:', UVAI);
print('Number of images:', UVAI.size());

var monthOffsets = ee.List.sequence(0, numberOfMonths - 1);

function createMonthlyImage(offset, reducer, statistic) {
  var monthStart = startDate.advance(ee.Number(offset), 'month');
  var monthEnd = monthStart.advance(1, 'month');
  var monthlyCollection = UVAI.filterDate(monthStart, monthEnd);

  var bandName = ee.String('UVAI_')
    .cat(statistic)
    .cat('_')
    .cat(monthStart.format('YYYY_MM'));

  return monthlyCollection.reduce(reducer)
    .rename(ee.List([bandName]))
    .clip(AOI)
    .set('system:time_start', monthStart.millis())
    .set('month', monthStart.format('YYYY-MM'));
}

// Monthly observation counts
var monthlyCounts = ee.FeatureCollection(
  monthOffsets.map(function(offset) {
    var monthStart = startDate.advance(ee.Number(offset), 'month');
    var monthEnd = monthStart.advance(1, 'month');

    return ee.Feature(null, {
      'month': monthStart.format('YYYY-MM'),
      'image_count': UVAI.filterDate(monthStart, monthEnd).size()
    });
  })
);

print('Monthly observation counts:', monthlyCounts);

function createMonthlyStack(reducer, statistic) {
  var monthlyImages = monthOffsets.map(function(offset) {
    return createMonthlyImage(offset, reducer, statistic);
  });

  var bandNames = monthOffsets.map(function(offset) {
    var date = startDate.advance(ee.Number(offset), 'month');

    return ee.String('UVAI_')
      .cat(ee.String(statistic))
      .cat('_')
      .cat(date.format('YYYY_MM'));
  });

  return ee.ImageCollection.fromImages(monthlyImages)
    .toBands()
    .rename(bandNames);
}

// Monthly statistics
var UVAI_Mean = createMonthlyStack(ee.Reducer.mean(), 'mean');
var UVAI_Min = createMonthlyStack(ee.Reducer.min(), 'min');
var UVAI_Max = createMonthlyStack(ee.Reducer.max(), 'max');

// Inspect
print('UVAI Mean:', UVAI_Mean);
print('UVAI Min:', UVAI_Min);
print('UVAI Max:', UVAI_Max);

// Display
Map.addLayer(UVAI_Mean, {}, 'UVAI Mean');
Map.addLayer(UVAI_Min, {}, 'UVAI Min');
Map.addLayer(UVAI_Max, {}, 'UVAI Max');

// Export
Export.image.toDrive({
  image: UVAI_Mean,
  description: 'UVAI_Mean',
  folder: 'GEE_Exports',
  fileNamePrefix: 'UVAI_Mean',
  region: AOI,
  maxPixels: 1e13
});

Export.image.toDrive({
  image: UVAI_Min,
  description: 'UVAI_Min',
  folder: 'GEE_Exports',
  fileNamePrefix: 'UVAI_Min',
  region: AOI,
  maxPixels: 1e13
});

Export.image.toDrive({
  image: UVAI_Max,
  description: 'UVAI_Max',
  folder: 'GEE_Exports',
  fileNamePrefix: 'UVAI_Max',
  region: AOI,
  maxPixels: 1e13
});

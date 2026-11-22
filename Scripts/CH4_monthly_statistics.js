// Sentinel-5P CH4: Monthly Mean, Minimum, Maximum
// November 2025 - October 2026

var AOI = geometry;
Map.centerObject(AOI, 5);

var startDate = ee.Date('2025-11-01');
var numberOfMonths = 12;
var endDate = startDate.advance(numberOfMonths, 'month');

var CH4 = ee.ImageCollection('COPERNICUS/S5P/OFFL/L3_CH4')
  .filterBounds(AOI)
  .filterDate(startDate, endDate)
  .select('CH4_column_volume_mixing_ratio_dry_air')
  .map(function(img) {
    return img.where(img.lt(0), 0)
      .copyProperties(img, ['system:time_start']);
  });

print('CH4 ImageCollection:', CH4);
print('Number of images:', CH4.size());

var monthOffsets = ee.List.sequence(0, numberOfMonths - 1);

function createMonthlyImage(offset, reducer, statistic) {
  var monthStart = startDate.advance(ee.Number(offset), 'month');
  var monthEnd = monthStart.advance(1, 'month');
  var monthlyCollection = CH4.filterDate(monthStart, monthEnd);

  var bandName = ee.String('CH4_')
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
      'image_count': CH4.filterDate(monthStart, monthEnd).size()
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

    return ee.String('CH4_')
      .cat(ee.String(statistic))
      .cat('_')
      .cat(date.format('YYYY_MM'));
  });

  return ee.ImageCollection.fromImages(monthlyImages)
    .toBands()
    .rename(bandNames);
}

// Monthly statistics
var CH4_Mean = createMonthlyStack(ee.Reducer.mean(), 'mean');
var CH4_Min = createMonthlyStack(ee.Reducer.min(), 'min');
var CH4_Max = createMonthlyStack(ee.Reducer.max(), 'max');

// Inspect
print('CH4 Mean:', CH4_Mean);
print('CH4 Min:', CH4_Min);
print('CH4 Max:', CH4_Max);

// Display
Map.addLayer(CH4_Mean, {}, 'CH4 Mean');
Map.addLayer(CH4_Min, {}, 'CH4 Min');
Map.addLayer(CH4_Max, {}, 'CH4 Max');

// Export
Export.image.toDrive({
  image: CH4_Mean,
  description: 'CH4_Mean',
  folder: 'GEE_Exports',
  fileNamePrefix: 'CH4_Mean',
  region: AOI,
  maxPixels: 1e13
});

Export.image.toDrive({
  image: CH4_Min,
  description: 'CH4_Min',
  folder: 'GEE_Exports',
  fileNamePrefix: 'CH4_Min',
  region: AOI,
  maxPixels: 1e13
});

Export.image.toDrive({
  image: CH4_Max,
  description: 'CH4_Max',
  folder: 'GEE_Exports',
  fileNamePrefix: 'CH4_Max',
  region: AOI,
  maxPixels: 1e13
});

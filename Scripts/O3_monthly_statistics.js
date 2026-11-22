// Sentinel-5P O3: Monthly Mean, Minimum, Maximum
// November 2025 - October 2026

var AOI = geometry;
Map.centerObject(AOI, 5);

var startDate = ee.Date('2025-11-01');
var numberOfMonths = 12;
var endDate = startDate.advance(numberOfMonths, 'month');

var O3 = ee.ImageCollection('COPERNICUS/S5P/OFFL/L3_O3')
  .filterBounds(AOI)
  .filterDate(startDate, endDate)
  .select('O3_column_number_density')
  .map(function(img) {
    return img.where(img.lt(0), 0)
      .copyProperties(img, ['system:time_start']);
  });

print('O3 ImageCollection:', O3);
print('Number of images:', O3.size());

var monthOffsets = ee.List.sequence(0, numberOfMonths - 1);

function createMonthlyImage(offset, reducer, statistic) {
  var monthStart = startDate.advance(ee.Number(offset), 'month');
  var monthEnd = monthStart.advance(1, 'month');
  var monthlyCollection = O3.filterDate(monthStart, monthEnd);

  var bandName = ee.String('O3_')
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
      'image_count': O3.filterDate(monthStart, monthEnd).size()
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

    return ee.String('O3_')
      .cat(ee.String(statistic))
      .cat('_')
      .cat(date.format('YYYY_MM'));
  });

  return ee.ImageCollection.fromImages(monthlyImages)
    .toBands()
    .rename(bandNames);
}

// Monthly statistics
var O3_Mean = createMonthlyStack(ee.Reducer.mean(), 'mean');
var O3_Min = createMonthlyStack(ee.Reducer.min(), 'min');
var O3_Max = createMonthlyStack(ee.Reducer.max(), 'max');

// Inspect
print('O3 Mean:', O3_Mean);
print('O3 Min:', O3_Min);
print('O3 Max:', O3_Max);

// Display
Map.addLayer(O3_Mean, {}, 'O3 Mean');
Map.addLayer(O3_Min, {}, 'O3 Min');
Map.addLayer(O3_Max, {}, 'O3 Max');

// Export
Export.image.toDrive({
  image: O3_Mean,
  description: 'O3_Mean',
  folder: 'GEE_Exports',
  fileNamePrefix: 'O3_Mean',
  region: AOI,
  maxPixels: 1e13
});

Export.image.toDrive({
  image: O3_Min,
  description: 'O3_Min',
  folder: 'GEE_Exports',
  fileNamePrefix: 'O3_Min',
  region: AOI,
  maxPixels: 1e13
});

Export.image.toDrive({
  image: O3_Max,
  description: 'O3_Max',
  folder: 'GEE_Exports',
  fileNamePrefix: 'O3_Max',
  region: AOI,
  maxPixels: 1e13
});

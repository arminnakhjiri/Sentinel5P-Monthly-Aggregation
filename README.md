# Sentinel-5P TROPOMI Monthly Atmospheric Statistics (Mean, Minimum, Maximum)

A collection of **Google Earth Engine JavaScript** scripts for generating monthly atmospheric composition statistics from the **Sentinel-5P TROPOMI OFFL L3** products.

The repository includes separate scripts for seven atmospheric parameters: **NO₂, SO₂, HCHO, UVAI, CO, CH₄, and O₃**. Each script calculates monthly pixel-wise mean, minimum, and maximum values over a user-defined Area of Interest (AOI).

For each parameter, the three statistical outputs are exported as separate multiband GeoTIFF files, each containing **12 bands representing November 2025 through October 2026**.

## 📌 Overview

- **Satellite**: Sentinel-5P (TROPOMI)
- **Data Source**: Copernicus Sentinel-5P OFFL L3 products
- **Parameters**: NO₂, SO₂, HCHO, UVAI, CO, CH₄, and O₃
- **Period**: 2025-11-01 to 2026-10-31
- **Temporal Resolution**: Monthly
- **Method**: Pixel-wise monthly aggregation using mean, minimum, and maximum reducers
- **Output**: Three multiband images (Mean, Min, Max) per parameter, each containing 12 monthly bands
- **Export Format**: GeoTIFF
- **Export Destination**: Google Drive
- **Purpose**: Monitoring atmospheric composition, analyzing monthly pollutant variability, and identifying temporal patterns in atmospheric trace gases and aerosols.

## 🛰️ Supported Parameters

| Parameter | Sentinel-5P Product | Selected Band |
|---|---|---|
| NO₂ | `COPERNICUS/S5P/OFFL/L3_NO2` | `tropospheric_NO2_column_number_density` |
| SO₂ | `COPERNICUS/S5P/OFFL/L3_SO2` | `SO2_column_number_density` |
| HCHO | `COPERNICUS/S5P/OFFL/L3_HCHO` | `tropospheric_HCHO_column_number_density` |
| UVAI | `COPERNICUS/S5P/OFFL/L3_AER_AI` | `absorbing_aerosol_index` |
| CO | `COPERNICUS/S5P/OFFL/L3_CO` | `CO_column_number_density` |
| CH₄ | `COPERNICUS/S5P/OFFL/L3_CH4` | `CH4_column_volume_mixing_ratio_dry_air` |
| O₃ | `COPERNICUS/S5P/OFFL/L3_O3` | `O3_column_number_density` |

## 🚀 How to Use

1. Open the [Google Earth Engine Code Editor](https://code.earthengine.google.com).
2. Select the JavaScript script corresponding to your desired atmospheric parameter from this repository.
3. Open the script in the Code Editor.
4. Draw or import your **Area of Interest** and assign it to `geometry`.
5. Run the script.
6. Check the Console for:
   - Original ImageCollection and total image count.
   - Monthly observation counts.
   - Generated monthly composites.
   - Output image information and band names.
7. Inspect the Mean, Min, and Max layers on the map.
8. Go to the **Tasks** tab and run the three export tasks.
9. Find the exported GeoTIFF files in the `GEE_Exports` folder in Google Drive.

## 📂 Repository Structure

Each atmospheric parameter has an independent JavaScript script:

| Script | Parameter |
|---|---|
| `NO2_monthly_statistics.js` | Nitrogen dioxide |
| `SO2_monthly_statistics.js` | Sulfur dioxide |
| `HCHO_monthly_statistics.js` | Formaldehyde |
| `UVAI_monthly_statistics.js` | Ultraviolet Aerosol Index |
| `CO_monthly_statistics.js` | Carbon monoxide |
| `CH4_monthly_statistics.js` | Methane |
| `O3_monthly_statistics.js` | Ozone |

All scripts follow the same general processing workflow:

1. Load and filter the corresponding Sentinel-5P ImageCollection.
2. Select the relevant atmospheric parameter band.
3. Generate monthly image collections for the 12-month period.
4. Calculate pixel-wise monthly mean, minimum, and maximum values.
5. Stack the monthly composites into three 12-band images.
6. Display the resulting images and export them to Google Drive.

## 📊 Outputs

Each parameter produces three independent multiband GeoTIFF files:

| Output | Description | Number of Bands |
|---|---|---:|
| `[Parameter]_Mean.tif` | Monthly mean | 12 |
| `[Parameter]_Min.tif` | Monthly minimum | 12 |
| `[Parameter]_Max.tif` | Monthly maximum | 12 |

For example, the NO₂ script generates:

- `NO2_Mean.tif`
- `NO2_Min.tif`
- `NO2_Max.tif`

The same naming convention applies to all other parameters.

**Band naming convention:**

- Mean: `[Parameter]_mean_YYYY_MM`
- Minimum: `[Parameter]_min_YYYY_MM`
- Maximum: `[Parameter]_max_YYYY_MM`

For example, the NO₂ mean image contains bands ranging from `NO2_mean_2025_11` to `NO2_mean_2026_10`.

Each monthly statistic is calculated independently for every pixel using the available satellite observations within the corresponding calendar month. Therefore, monthly minimum and maximum values represent pixel-wise temporal statistics, not regional statistics.

## ⚙️ Processing Notes

- **Temporal coverage:** The processing period includes November 2025 through October 2026. The end date is exclusive (`2026-11-01`).
- **Monthly coverage:** Monthly observation counts are printed in the Console to help identify months with limited or no available imagery. These counts represent the number of images intersecting the AOI, not valid observations at every pixel.
- **Negative values:** For the gas products, negative retrieval values are replaced with zero before monthly aggregation. This ensures nonnegative statistical outputs but can introduce a positive bias in the calculated means. UVAI is treated separately because negative values are meaningful components of the aerosol index and are retained.
- **Spatial resolution:** The scripts do not explicitly specify an export scale or coordinate reference system. These can be configured in the export settings when a consistent spatial grid is required.
- **Data availability:** The temporal completeness of each monthly composite depends on the availability of Sentinel-5P observations.

## 🔗 References

**Sentinel-5P Datasets – Google Earth Engine Data Catalog**

- [NO₂ – Nitrogen Dioxide](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S5P_OFFL_L3_NO2)
- [SO₂ – Sulfur Dioxide](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S5P_OFFL_L3_SO2)
- [HCHO – Formaldehyde](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S5P_OFFL_L3_HCHO)
- [AER_AI – UV Aerosol Index](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S5P_OFFL_L3_AER_AI)
- [CO – Carbon Monoxide](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S5P_OFFL_L3_CO)
- [CH₄ – Methane](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S5P_OFFL_L3_CH4)
- [O₃ – Ozone](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S5P_OFFL_L3_O3)

**Google Earth Engine Documentation**

- [Earth Engine JavaScript API](https://developers.google.com/earth-engine/guides/javascript)
- [Export.image.toDrive](https://developers.google.com/earth-engine/apidocs/export-image-todrive)

---

## Author

**Armin Nakhjiri**  
Remote Sensing Scientist  
✉️ Nakhjiri.Armin@gmail.com

---

*Empowering the next generation of geospatial analysts, one script at a time.*

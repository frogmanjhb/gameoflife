-- Migration: Remove Notice Board feature (graphic designers use Town News Board instead)

DROP TABLE IF EXISTS notice_board_posters;
DROP TABLE IF EXISTS notice_board_settings;

DELETE FROM plugins WHERE route_path = '/notice-board';

UPDATE plugins
SET description = 'Town News Board — stories, posters and photos from your town journalists and graphic designers'
WHERE route_path = '/news';

import csv
import os
from shutil import copyfile
from PIL import Image


class CSVParser:
    eyevido_ds = dict()
    id_mapping = dict()
    merged_mouse_data = []
    merged_gaze_data = []

    def csv_import(self):
        # print('import started')
        path = 'csv_in/'
        listing = os.listdir(path)
        for file in listing:
            fn = file[:-7]
            if fn not in self.eyevido_ds.keys():
                with open(path + file) as f:
                    i = 0
                    for line in f:
                        line = line[:-1]
                        vals = []
                        if line.find('"') == -1:
                            vals = line.split(',')
                        else:
                            lines = line.split(',"')
                            for l in lines:
                                if l.find('"') == -1:
                                    vals = vals + l.split(',')
                                else:
                                    vals.append(l.split('"')[0])
                                    temp = l.split('"')[1]
                                    if temp.startswith(','):
                                        temp = temp[1:]
                                    temp = temp.split(',')
                                    vals = vals + temp
                        if i == 0:
                            self.eyevido_ds[fn] = dict()
                            self.eyevido_ds[fn]['label'] = vals
                            self.eyevido_ds[fn]['values'] = []
                        else:
                            self.eyevido_ds[fn]['values'].append(vals)
                        i += 1
                        # print('import finished')

    def csv_export(self):
        print('export started')
        global_gaze_out = dict()
        global_mouse_out = dict()
        global_screenshot_mapping = []
        metadata = []
        # iterate over web_groups
        for web_group in self.eyevido_ds['web_groups']['values']:
            mouse_out = []
            gaze_out = []
            max_screen = -1
            # iterate over web_results
            for web_result in self.eyevido_ds['web_results']['values']:
                if web_result[3][:-2] == web_group[0]:
                    print('load web_result ' + web_result[0] + ' in web_group ' + web_group[0])
                    # iterate over mouse data
                    for interaction in self.eyevido_ds['interactions']['values']:
                        if interaction[1] == web_result[0]:
                            # user; timestamp; x; y; type
                            mouse_out.append(
                                [web_result[1], interaction[2], interaction[3], interaction[4], interaction[5]])
                    # iterate over gaze data
                    for image_fixation in self.eyevido_ds['image_fixations']['values']:
                        if image_fixation[1] == web_result[0]:
                            # user; timestamp; x; y; duration
                            gaze_out.append([web_result[1], image_fixation[2], image_fixation[3], image_fixation[4],
                                             image_fixation[5]])
                    try:
                        if max_screen != -1:
                            if os.path.getsize('screenshots/' + web_result[8]) >= os.path.getsize(
                                            'screenshots/' + max_screen):
                                max_screen = web_result[8]
                        else:
                            if os.path.isfile('screenshots/' + web_result[8]):
                                max_screen = web_result[8]
                            else:
                                pass
                    except FileNotFoundError:
                        pass
            # web_group_id; web_id; study_id; url to screenshot
            if max_screen == -1:
                max_screen = 'NULL'
            if max_screen != 'NULL':
                screenshot_pil = Image.open('screenshots/' + max_screen)
                screenshot_width, screenshot_height = screenshot_pil.size
                self.id_mapping[web_group[0]] = self.aux_create_filename(web_group[2])
                study_id = self.aux_find_study_id(web_group[2])
                global_screenshot_mapping.append(
                    [web_group[0], web_group[2], study_id, max_screen, screenshot_width,
                     screenshot_height])
                # TODO: implement
                # study_id; study_title; web_id; web_title; web_group_id; web_group_title; url; screenshot; width; height; num_user
                metadata.append(
                    [study_id, web_group[2], web_group[0], self.id_mapping[web_group[0]], web_group[1], max_screen,
                     screenshot_width, screenshot_height])
                global_mouse_out[web_group[0]] = mouse_out
                for elem in mouse_out:
                    # study_id; web_id; web_group_id; filename; user; timestamp; x; y; type
                    self.merged_mouse_data.append(
                        [study_id, web_group[2], web_group[0], self.id_mapping[web_group[0]],
                         elem[0], elem[1], elem[2], elem[3], elem[4]])
                global_gaze_out[web_group[0]] = gaze_out
                for elem in gaze_out:
                    # study_id; web_id; web_group_id; filename; user; timestamp; x; y; duration
                    self.merged_gaze_data.append(
                        [study_id, web_group[2], web_group[0], self.id_mapping[web_group[0]],
                         elem[0], elem[1], elem[2], elem[3], elem[4]])
                copyfile('screenshots/' + max_screen, 'screenshot_out/img_' + self.id_mapping[web_group[0]] + '.jpg')
        # iterate over web_result to find the single group results
        for web_result in self.eyevido_ds['web_results']['values']:
            mouse_out = []
            gaze_out = []
            if web_result[3] == '':
                virtual_web_group_id = web_result[1] + web_result[0]
                print('load web_result ' + web_result[0] + ' in virtual_single_node ' + virtual_web_group_id)
                # iterate over mouse data
                for interaction in self.eyevido_ds['interactions']['values']:
                    if interaction[1] == web_result[0]:
                        # user; timestamp; x; y; type
                        mouse_out.append(
                            [web_result[1], interaction[2], interaction[3], interaction[4], interaction[5]])
                # iterate over gaze data
                for image_fixation in self.eyevido_ds['image_fixations']['values']:
                    if image_fixation[1] == web_result[0]:
                        # user; timestamp; x; y; duration
                        gaze_out.append(
                            [web_result[1], image_fixation[2], image_fixation[3], image_fixation[4], image_fixation[5]])
                # check whether screenshot file exists
                if os.path.isfile('screenshots/' + web_result[8]):
                    screenshot_url = web_result[8]
                    screenshot_pil = Image.open('screenshots/' + screenshot_url)
                    screenshot_width, screenshot_height = screenshot_pil.size
                else:
                    screenshot_url = 'NULL'
                # web_group_id; web_id; study_id; url to screenshot
                if screenshot_url != 'NULL':
                    self.id_mapping[virtual_web_group_id] = self.aux_create_filename(web_result[2])
                    study_id = self.aux_find_study_id(web_result[2])
                    global_screenshot_mapping.append(
                        [virtual_web_group_id, web_result[2], study_id, screenshot_url,
                         screenshot_width, screenshot_height])
                    # TODO: implement
                    # study_id; study_title; web_id; web_title; web_group_id; web_group_title; url; screenshot; width; height; num_user
                    metadata.append(
                        [study_id, web_result[2], virtual_web_group_id, self.id_mapping[virtual_web_group_id],
                         web_result[5], screenshot_url, screenshot_width, screenshot_height])
                    global_mouse_out[virtual_web_group_id] = mouse_out
                    for elem in mouse_out:
                        # study_id; web_id; web_group_id; filename; user; timestamp; x; y; type
                        self.merged_mouse_data.append(
                            [study_id, web_result[2], virtual_web_group_id, self.id_mapping[virtual_web_group_id],
                             elem[0], elem[1], elem[2], elem[3], elem[4]])
                    global_gaze_out[virtual_web_group_id] = gaze_out
                    for elem in gaze_out:
                        # study_id; web_id; web_group_id; filename; user; timestamp; x; y; duration
                        self.merged_gaze_data.append(
                            [study_id, web_result[2], virtual_web_group_id, self.id_mapping[virtual_web_group_id],
                             elem[0], elem[1], elem[2], elem[3], elem[4]])
                    copyfile('screenshots/' + web_result[8],
                             'screenshot_out/img_' + self.id_mapping[virtual_web_group_id] + '.jpg')
        # iterate over mouse data and print csv files
        for mouse_out_key in global_mouse_out.keys():
            mouse_filename = 'csv_out/mouse_' + self.id_mapping[mouse_out_key] + '.csv'
            aux_write_file(mouse_filename, ['user_id', 'timestamp', 'x', 'y', 'type'],
                           global_mouse_out[mouse_out_key])
        # iterate over gaze data and print csv files
        for gaze_out_key in global_gaze_out.keys():
            gaze_filename = 'csv_out/gaze_' + self.id_mapping[gaze_out_key] + '.csv'
            aux_write_file(gaze_filename, ['user_id', 'timestamp', 'x', 'y', 'duration'],
                           global_gaze_out[gaze_out_key])
        # print screenshot mapping file
        aux_write_file('csv_out/screenshot_mapping.csv',
                       ['web_group_id', 'web_id', 'study_id', 'screenshot', 'width', 'height'],
                       global_screenshot_mapping)
        # print merged mouse data file
        aux_write_file('csv_out/merged_mouse.csv',
                       ['study_id', 'web_id', 'web_group_id', 'filename', 'user_id', 'timestamp', 'x', 'y', 'type'],
                       self.merged_mouse_data)
        # print merged gaze data file
        aux_write_file('csv_out/merged_gaze.csv',
                       ['study_id', 'web_id', 'web_group_id', 'filename', 'user_id', 'timestamp', 'x', 'y', 'duration'],
                       self.merged_gaze_data)
        # print metadata file
        aux_write_file('csv_out/metadata.csv',
                       ['study_id', 'web_id', 'web_group_id', 'title', 'url', 'screenshot', 'width', 'height'],
                       metadata)
        print('export finished')

    # helper function for finding study id
    def aux_find_study_id(self, web_id_in):
        for web_id in self.eyevido_ds['webs']['values']:
            if web_id[0] == web_id_in:
                return web_id[1]

    # helper function to check, wheater all screenshots are loaded
    def aux_check_files(self):
        listing = os.listdir('csv_out')
        g = []
        for file in listing:
            if file.startswith('gaze'):
                fn = file[5:-4]
                g.append(fn)
        listing = os.listdir('screenshot_out')
        s = []
        for file in listing:
            if file.startswith('img'):
                fn = file[4:-4]
                s.append(fn)
        print('compare screenshots and gaze files -> ' + str(bool(set(s).intersection(g))))

    # helper function that creates filenames
    def aux_create_filename(self, web_id):
        for web_shortcut in self.eyevido_ds['webs-shortcuts']['values']:
            if web_shortcut[0] == web_id:
                ws_prefix = str(web_shortcut[1]) + '_' + str(web_shortcut[2])
                i = 0
                for ws_id in self.id_mapping.values():
                    if str(ws_id).startswith(ws_prefix):
                        i += 1
                return ws_prefix + '_' + str(i)


# helper function for printing csv file
def aux_write_file(filename, schema, data):
    print('write ' + filename + ' with schema: ' + str(schema))
    with open(filename, 'w', newline='') as csvfile:
        w = csv.writer(csvfile, delimiter=';')
        w.writerow(schema)
        for elem in data:
            w.writerow(elem)


p = CSVParser()
p.csv_import()
p.csv_export()
p.aux_check_files()

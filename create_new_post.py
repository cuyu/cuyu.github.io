# -*- coding: utf-8 -*-
import sys
import os
import datetime

THIS_FILE_DIR = os.path.split(os.path.abspath(__file__))[0]


if __name__ == '__main__':
    assert len(sys.argv) == 2, 'Can only accept a parameter!'
    post_name = sys.argv[1]
    post_words = post_name.split(' ')
    today = datetime.date.today()
    file_name = str(today)
    for word in post_words:
        file_name += '-' + word
    file_name += '.md'
    content = """---
layout: post
title: "{title}"
date: {date}
---""".format(title=post_name, date=str(today))
    with open(THIS_FILE_DIR + '/_posts/{0}'.format(file_name), 'w') as f:
        f.write(content)
    print "\"{0}\" has been created under _posts folder.".format(file_name)

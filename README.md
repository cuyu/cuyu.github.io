# cuyu.github.io
This is my personal blog.

### CLI

I've write a python script to generate new mark down file and some other convenient functions:

```
./blogging new {title} {category} {[tag1, tag2]}
```

This will generate a new file (under `./_drafts/`) with some meta data and open it.

```
./blogging ls category
```

This will list all the categories and corresponding count.

```
./blogging ls tag
```

The same but list tags instead.

```
./blogging save
```

This will commit in all the changes in `./_drafts/` folder.

```
./blogging publish {file_name}
```

This will move the file from `./_drafts/` to `./_posts/` and commit it to the Github pages.

### TODO List

#### For the site:

- ~~Add visit statistics~~
- ~~Add tags for article~~
- ~~Add message board~~
- ~~Display the summary of the articles on main page intead of the whole articles~~
- Randomly changed background image
- Add license
- ~~Add about page~~
- ~~Complete sidebar~~
- More cool animation
- ~~A playground page to display some front-end cool staff~~
- *A side bar to display footnotes
  *Seems a little bit difficult to implement as Github disables customize Jekyll plugins. Although we can use Javascript to relocate footnotes after Jekyll rendered, the footnote cannot contain multi-lines. All these (limitations) make it complicated to achieve a notebook-like page layout.*
- In site content search (can use google)
- A statistics page (e.g. the rank of each post viewed/commented, the average word count, etc.)
- Besides create date, display edit date (if the post is edited later)

#### For CLI:

- Can push specific post to git and there can be a post time besides a create time
- Auto complete category/tags
- Colourful
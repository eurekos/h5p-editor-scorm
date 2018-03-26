/**
 * ScormFile widget module.
 *
 * @param {H5P.jQuery} $
 */
H5PEditor.widgets.scormFile = H5PEditor.ScormFile = (function($) {

  /**
   * Adds a file upload field to the form.
   *
   * @param {mixed} parent
   * @param {object} field
   * @param {mixed} params
   * @param {function} setValue
   * @returns {H5PEditor.File}
   */
  ScormFile = function(parent, field, params, setValue) {
    var self = this;

    // Initialize inheritance.
    H5PEditor.ScormFileUploader.call(self, field);

    this.parent = parent;
    this.field = field;
    this.params = params;
    this.setValue = setValue;
    this.library = parent.library + '/' + field.name;
    this.changes = [];
    this.passReadies = true;

    parent.ready(function() {
      self.passReadies = false;
    });

    // Create remove file dialog.
    this.confirmRemovalDialog = new H5P.ConfirmationDialog({
      headerText: H5PEditor.t('core', 'removeFile'),
      dialogText: H5PEditor.t('core', 'confirmRemoval', {':type': 'file'})
    }).appendTo(document.body);

    // Remove file on confirmation.
    this.confirmRemovalDialog.on('confirmed', function() {
      delete self.params;
      self.setValue(self.field);
      self.addFile();

      for (var i = 0; i < self.changes.length; i++) {
        self.changes[i]();
      }
    });

    // When uploading starts.
    self.on('upload', function() {
      // Insert throbber.
      self.$file.html('<div class="h5peditor-uploading h5p-throbber">' + H5PEditor.t('core', 'uploading') + '</div>');

      // Clear old error messages.
      self.$errors.html('');
    });

    // Handle upload complete.
    self.on('uploadComplete', function(event) {
      var result = event.data;

      try {
        if (result.error) {
          // We don't need to use Error() instance, because it's adding
          // the "Error:" prefix.
          throw result.error;
        }

        self.params = self.params || {};
        self.params.path = result.data.path;
        self.params.mime = result.data.mime;
        self.params.filename = result.data.filename;
        self.params.extracted = result.data.extracted;
        self.params.url = result.data.url;
        self.params.pages = result.data.pages;
        self.params.type = result.data.type;
        self.params.params = result.data.params;

        // Make it possible for other widgets to process the result
        self.trigger('fileUploaded', result.data);

        self.setValue(self.field, self.params);

        for (var i = 0; i < self.changes.length; i++) {
          self.changes[i](self.params);
        }
      }
      catch (error) {
        self.$errors.html('');
        self.$errors.append(H5PEditor.createError(error));
      }

      self.addFile();
    });
  };

  ScormFile.prototype = Object.create(H5PEditor.ScormFileUploader.prototype);
  ScormFile.prototype.constructor = H5PEditor.File;

  /**
   * Append field to the given wrapper.
   *
   * @param {jQuery} $wrapper
   * @returns {undefined}
   */
  ScormFile.prototype.appendTo = function($wrapper) {
    var label = '', description, fileHtml, html, $container;

    if (this.field.label !== 0) {
      label = '<div class="h5peditor-label' + (this.field.optional ? '' : ' h5peditor-required') + '">' + (this.field.label === undefined ? this.field.name : this.field.label) + '</div>';
    }

    description = H5PEditor.createDescription(this.field.description);
    fileHtml = '<div class="scorm-file"></div>';

    html = H5PEditor.createItem('scorm-item-' + this.field.type, label + description + fileHtml);
    $container = H5PEditor.$(html).appendTo($wrapper);

    this.$file = $container.find('.scorm-file');
    this.$errors = $container.find('.h5p-errors');
    this.addFile();
  };

  /**
   * Creates thumbnail HTML and actioH5PEditor.
   *
   * @returns {void}
   */
  ScormFile.prototype.addFile = function() {
    var that = this, html;

    if (this.params === undefined) {
      html = '<button class="upload">' + H5PEditor.t('H5PEditor.ScormFile', 'uploadButton') + '</button>' +
        H5PEditor.createDescription(H5PEditor.t('H5PEditor.ScormFile', 'uploadDescription'));

      this.$file.html(html).children('.upload').click(function() {
        that.openFileSelector();
        return false;
      });
      return;
    }

    html = '<span class="filename">' + that.params.filename + '</span>&nbsp;' +
      '<button class="remove">' + H5PEditor.t('H5PEditor.ScormFile', 'removeButton') + '</button>' +
      H5PEditor.createDescription(H5PEditor.t('H5PEditor.ScormFile', 'removeDescription'));

    this.$file.html(html).find('.remove').click(function() {
      that.confirmRemovalDialog.show(H5P.jQuery(this).offset().top);
      return false;
    });
  };

  /**
   * Validate this item
   */
  ScormFile.prototype.validate = function() {
    return true;
  };

  /**
   * Remove this item.
   */
  ScormFile.prototype.remove = function() {
    // TODO: Check what happens when removed during upload.
    this.$file.parent().remove();
  };

  /**
   * Collect functions to execute once the tree is complete.
   *
   * @param {function} ready
   * @returns {undefined}
   */
  ScormFile.prototype.ready = function(ready) {
    if (this.passReadies) {
      this.parent.ready(ready);
    }
    else {
      ready();
    }
  };

  return ScormFile;
})(H5P.jQuery);

// Add translatable error for fileToLarge error with maximum upload file size on server.
H5P.jQuery.ajax({
  method: 'get',
  dataType: 'text',
  url: H5PEditor.getAjaxUrl('config'),
  success: function(response) {
    if (response) {
      response = JSON.parse(response);
      if (response.upload_max_size) {
        H5PEditor.language['H5PEditor.ScormFile']['libraryStrings']['fileToLarge'] = 'The specified file is too large for the server to process. Maximum allowed file size is ' + response.upload_max_size.value + '.';
        H5PEditor.upload_max_size = response.upload_max_size;
      }
    }
  }
});

// Add strings for l10n.
H5PEditor.language['H5PEditor.ScormFile'] = {
  libraryStrings: {
    uploadButton: 'Choose file',
    uploadDescription: 'Choose a file package with .zip extension.',
    removeButton: 'Remove',
    removeDescription: 'Remove to choose another package.'
  }
};
